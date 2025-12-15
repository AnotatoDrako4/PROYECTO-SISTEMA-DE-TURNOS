
import { supabase } from "./supabase";

const SESSION_KEY = "municipal_session";

/* ============================================
   SANITIZACIÓN ROBUSTA
============================================ */

function sanitize(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFKC")
    .replace(/[\u200B-\u200F\uFEFF\u00A0\u180E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(email: string): string {
  return sanitize(email).toLowerCase().replace(/\s/g, "");
}

/* ============================================
   RATE LIMIT (5/min)
============================================ */

const loginAttempts: Record<string, { count: number; timestamp: number }> = {};

function checkRateLimit(email: string): boolean {
  const now = Date.now();

  if (!loginAttempts[email]) {
    loginAttempts[email] = { count: 1, timestamp: now };
    return true;
  }

  const entry = loginAttempts[email];

  if (now - entry.timestamp > 60000) {
    entry.count = 1;
    entry.timestamp = now;
    return true;
  }

  entry.count++;
  return entry.count <= 5;
}

/* ============================================
   PBKDF2 — EXACTO A SQL
============================================ */

// Exportado para usar en useMockData al crear usuarios
export async function deriveHash(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 150000,
      hash: "SHA-256"
    },
    key,
    256
  );

  return [...new Uint8Array(bits)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Genera un hash y salt seguros para una nueva contraseña.
 * Útil para crear usuarios desde el admin.
 */
export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.randomUUID(); // Generamos un salt aleatorio
  const hash = await deriveHash(password, salt);
  return { hash, salt };
}

/* ============================================
   AUTH FINAL — 100% ESTABLE
============================================ */

export const auth = {
  login: async (rawEmail: string, rawPassword: string) => {
    try {
      const email = normalizeEmail(rawEmail);
      const password = sanitize(rawPassword);

      if (!email || !password) {
        return { success: false, error: "Ingrese credenciales válidas." };
      }

      if (!checkRateLimit(email)) {
        return { success: false, error: "Demasiados intentos. Espere 1 minuto." };
      }

      /* ===============================
         1. RPC → SIEMPRE ARRAY
      ===============================*/
      const { data: rpc, error: rpcError } = await supabase.rpc(
        "get_user_for_login",
        { p_email: email }
      );

      if (rpcError) {
        console.error("🔥 RPC ERROR:", rpcError);
        return { success: false, error: "Error con el servidor." };
      }

      // NORMALIZACIÓN REAL Y CORRECTA
      const user = Array.isArray(rpc) && rpc.length > 0 ? rpc[0] : null;

      if (!user) {
        await new Promise((r) => setTimeout(r, 300));
        return { success: false, error: "Credenciales inválidas." };
      }

      /* ===============================
         2. Validar integridad
      ===============================*/
      if (!user.password_hash || !user.password_salt) {
        console.error("⚠ Sin hash/salt:", user.id);
        return { success: false, error: "Credenciales inválidas." };
      }

      /* ===============================
         3. Verificar password
      ===============================*/
      const generated = await deriveHash(password, user.password_salt);

      if (!safeCompare(generated, user.password_hash)) {
        return { success: false, error: "Credenciales inválidas." };
      }

      /* ===============================
         4. Crear sesión
      ===============================*/
      const session = {
        username: user.name,
        email: user.email,
        role: user.role,
        loginDate: new Date().toISOString(),
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          assignedDepartments: user.assigned_departments || [],
          permissions: user.permissions || {}, // FIXED: Default to object for JSONB
          funcionarioId: user.funcionario_id, // Added mapped field
        },
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      return { success: true };

    } catch (err) {
      console.error("❌ AUTH ERROR:", err);
      return { success: false, error: "Error interno del sistema." };
    }
  },

  logout: () => localStorage.removeItem(SESSION_KEY),
  isAuthenticated: () => !!localStorage.getItem(SESSION_KEY),

  getSession: () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getUserProfile: () => {
    const s = auth.getSession();
    return s ? s.profile : null;
  }
};
