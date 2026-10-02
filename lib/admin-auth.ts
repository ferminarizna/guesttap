import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "ariznafermin@gmail.com";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan variables de entorno de Supabase.");
}

const supabaseAuth = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function verificarAdministrador(
  request: NextRequest
) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      ),
    };
  }

  const accessToken = authorization
    .replace("Bearer ", "")
    .trim();

  if (!accessToken) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "No autorizado." },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Sesión inválida." },
        { status: 401 }
      ),
    };
  }

  const userEmail = user.email?.trim().toLowerCase();

  if (userEmail !== ADMIN_EMAIL) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "No tenés permisos de administrador." },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}