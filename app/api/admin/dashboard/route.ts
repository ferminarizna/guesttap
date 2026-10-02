import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verificarAdministrador } from "../../../../lib/admin-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan variables de entorno de Supabase.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET(request: NextRequest) {
  try {
    const auth = await verificarAdministrador(request);

    if (auth.response) {
      return auth.response;
    }

    const {
      data: businesses,
      error: businessesError,
    } = await supabaseAdmin
      .from("businesses")
      .select(
        "id, name, slug, google_url, instagram_url, whatsapp"
      )
      .order("id", { ascending: true });

    if (businessesError) {
      console.error(
        "Error obteniendo negocios:",
        businessesError
      );

      return NextResponse.json(
        { error: "No se pudieron obtener los negocios." },
        { status: 500 }
      );
    }

    const {
      data: feedback,
      error: feedbackError,
    } = await supabaseAdmin
      .from("feedback")
      .select(
        "id, created_at, message, rating, business_id"
      )
      .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error(
        "Error obteniendo feedback:",
        feedbackError
      );

      return NextResponse.json(
        { error: "No se pudo obtener el feedback." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      businesses: businesses || [],
      feedback: feedback || [],
    });
  } catch (error) {
    console.error(
      "Error en GET /api/admin/dashboard:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}