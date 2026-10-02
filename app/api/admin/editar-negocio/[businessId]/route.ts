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

function convertirWhatsApp(valor: string) {
  const texto = valor.trim();

  if (!texto) {
    return null;
  }

  if (texto.startsWith("https://wa.me/")) {
    return texto;
  }

  if (texto.startsWith("http://wa.me/")) {
    return texto.replace("http://", "https://");
  }

  const numero = texto.replace(/\D/g, "");

  if (!numero) {
    return null;
  }

  if (numero.startsWith("549")) {
    return `https://wa.me/${numero}`;
  }

  if (numero.startsWith("54")) {
    return `https://wa.me/${numero}`;
  }

  return `https://wa.me/549${numero}`;
}

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

    const { data: business, error } =
      await supabaseAdmin
        .from("businesses")
        .select(
          "id, name, google_url, instagram_url, whatsapp, logo_url"
        )
        .eq("id", numericId)
        .single();

    if (error || !business) {
      console.error(
        "Error obteniendo negocio:",
        error
      );

      return NextResponse.json(
        { error: "No se pudo cargar el negocio." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      business,
    });
  } catch (error) {
    console.error(
      "Error en GET /api/admin/editar-negocio/[businessId]:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const googleUrl =
      typeof body.google_url === "string"
        ? body.google_url.trim()
        : "";

    const instagramUrl =
      typeof body.instagram_url === "string"
        ? body.instagram_url.trim()
        : "";

    const whatsapp =
      typeof body.whatsapp === "string"
        ? body.whatsapp.trim()
        : "";

    const logoUrl =
      typeof body.logo_url === "string"
        ? body.logo_url.trim()
        : "";

    if (!name) {
      return NextResponse.json(
        {
          error:
            "El nombre del negocio es obligatorio.",
        },
        { status: 400 }
      );
    }

    const { data: updatedBusiness, error } =
      await supabaseAdmin
        .from("businesses")
        .update({
          name,
          google_url: googleUrl || null,
          instagram_url: instagramUrl || null,
          whatsapp: convertirWhatsApp(whatsapp),
          logo_url: logoUrl || null,
        })
        .eq("id", numericId)
        .select(
          "id, name, slug, google_url, instagram_url, whatsapp, logo_url"
        )
        .single();

    if (error) {
      console.error(
        "Error actualizando negocio:",
        error
      );

      return NextResponse.json(
        {
          error:
            "No se pudieron guardar los cambios.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
    });
  } catch (error) {
    console.error(
      "Error en PUT /api/admin/editar-negocio/[businessId]:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}