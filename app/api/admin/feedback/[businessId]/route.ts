import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verificarAdministrador } from "../../../../../lib/admin-auth";

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

type RouteContext = {
  params: Promise<{
    businessId: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const auth = await verificarAdministrador(request);

    if (auth.response) {
      return auth.response;
    }

    const { businessId } = await params;
    const numericId = Number(businessId);

    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: "ID de negocio inválido." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } =
      await supabaseAdmin
        .from("businesses")
        .select("id, name")
        .eq("id", numericId)
        .single();

    if (businessError || !business) {
      console.error(
        "Error obteniendo negocio:",
        businessError
      );

      return NextResponse.json(
        { error: "No se pudo encontrar el negocio." },
        { status: 404 }
      );
    }

    const { data: feedback, error: feedbackError } =
      await supabaseAdmin
        .from("feedback")
        .select(
          "id, created_at, message, rating"
        )
        .eq("business_id", numericId)
        .order("created_at", {
          ascending: false,
        });

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
      business,
      feedback: feedback || [],
    });
  } catch (error) {
    console.error(
      "Error en GET /api/admin/feedback/[businessId]:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}