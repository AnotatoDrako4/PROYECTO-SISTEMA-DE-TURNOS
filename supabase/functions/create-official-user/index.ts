import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: any) => {
  // 1. Manejo de Preflight request para CORS (IMPORTANTE)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Crear Cliente Supabase con Service Role
    // Usamos variables de entorno que deben estar configuradas en el proyecto Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
        throw new Error("Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 3. Parsear Body de forma segura
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: "Body inválido (no es JSON)" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const { 
      rut, 
      rut_normalized, 
      nombre, 
      apellido, 
      email, 
      password, 
      modalidad, 
      unidad_id, 
      cargo, 
      weekly_hours
    } = body;

    // Validaciones básicas de entrada
    if (!email || !password || !rut) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "Faltan datos obligatorios (email, password, rut)" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Crear Usuario en Supabase Auth (Admin API)
    const { data: userData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: `${nombre} ${apellido}`,
        rut: rut
      }
    });

    if (authError) {
      console.error("Auth Error:", authError);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `Error Auth: ${authError.message}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!userData.user) {
       return new Response(JSON.stringify({ 
         ok: false, 
         error: "No se pudo crear el usuario Auth (Respuesta vacía)" 
       }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;

    // 5. Insertar Datos de Negocio (RPC SQL Atomic)
    const { error: dbError } = await supabaseClient.rpc('registrar_funcionario_db', {
      p_user_id: userId,
      p_rut: rut,
      p_rut_normalized: rut_normalized,
      p_email: email,
      p_nombre: nombre,
      p_apellido: apellido,
      p_cargo: cargo,
      p_modalidad: modalidad,
      p_unidad_id: unidad_id,
      p_weekly_hours: weekly_hours || '44:00:00'
    });

    if (dbError) {
      console.error("DB RPC Error:", dbError);
      // Rollback: Eliminar usuario de Auth si falla la DB
      await supabaseClient.auth.admin.deleteUser(userId);
      
      return new Response(JSON.stringify({ 
        ok: false, 
        error: `Error Base de Datos: ${dbError.message}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 6. Éxito
    return new Response(JSON.stringify({ 
      ok: true, 
      userId 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error: any) {
    console.error("Internal Edge Error:", error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message || "Error Interno del Servidor" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});