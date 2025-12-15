
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { cleanRut } from '../utils/rutUtils';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  role: string | null;
  modalidad: string | null;
  loading: boolean;
  loginFuncionario: (rut: string, pass: string) => Promise<{ error: string | null }>;
  loginAdmin: (email: string, pass: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [modalidad, setModalidad] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Función auxiliar para cargar perfil y validar existencia
  const loadUserProfile = async (currentUser: User) => {
    try {
      // 1. Obtener Rol desde user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      if (profileError || !profile) {
          console.error("Error cargando perfil", profileError);
          // Si falla perfil, logout
          await supabase.auth.signOut();
          throw new Error('Error cargando perfil de usuario.');
      }

      // 2. Lógica de Seguridad para Funcionarios
      if (profile.role !== 'Super Admin') {
        // Extraemos el RUT del email falso (ej: 123456789@grde.cl -> 123456789)
        // Asumimos que el email se genera como rutLimpio@grde.cl
        const rutFromEmail = currentUser.email?.split('@')[0].toUpperCase();
        
        // Consulta CRÍTICA: ¿Existe este RUT en la tabla de funcionarios activos?
        // Se busca por rut_normalized o rut
        const { data: funcData, error: funcError } = await supabase
          .from('funcionarios')
          .select('modalidad_turno, estado')
          .or(`rut_normalized.eq.${rutFromEmail},rut.eq.${rutFromEmail}`)
          .single();

        // 🛡️ REGLA DE SEGURIDAD: Si no existe o no está activo -> EXPULSIÓN
        if (funcError || !funcData || funcData.estado !== 'Activo') {
          console.error("⛔ SEGURIDAD: Usuario autenticado pero NO es funcionario activo.");
          await supabase.auth.signOut();
          throw new Error('Este RUT no corresponde a un funcionario activo.');
        }

        setModalidad(funcData.modalidad_turno);
      } else {
        // Super Admin no tiene modalidad de turno
        setModalidad('Administrativo'); 
      }

      setUser(currentUser);
      setRole(profile.role);
    } catch (error) {
      console.error("Error en carga de perfil:", error);
      setUser(null);
      setRole(null);
      setModalidad(null);
    } finally {
      setLoading(false);
    }
  };

  // Cargar sesión inicial al montar
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
    };
    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Solo recargar si cambia el usuario (evitar loops)
        if (session.user.id !== user?.id) {
            setLoading(true);
            await loadUserProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setRole(null);
        setModalidad(null);
        setLoading(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [user?.id]); 

  const loginFuncionario = async (rut: string, pass: string) => {
    setLoading(true);
    try {
        const rutLimpio = cleanRut(rut);
        const fakeEmail = `${rutLimpio}@grde.cl`;
        
        const { error } = await supabase.auth.signInWithPassword({
          email: fakeEmail,
          password: pass
        });
        
        if (error) throw error;
        return { error: null };
    } catch (err: any) {
        setLoading(false);
        return { error: err.message || "Error al iniciar sesión" };
    }
  };

  const loginAdmin = async (email: string, pass: string) => {
    setLoading(true);
    try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pass
        });
        if (error) throw error;
        return { error: null };
    } catch (err: any) {
        setLoading(false);
        return { error: err.message || "Error de autenticación" };
    }
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setModalidad(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, modalidad, loading, loginFuncionario, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
