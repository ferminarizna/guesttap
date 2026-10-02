import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../../lib/supabase-server";

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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No hay una sesión iniciada." },
        { status: 401 }
      );
    }

    const { data: businessUser, error: businessUserError } =
      await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

    if (businessUserError) {
      console.error(
        "Error obteniendo negocio del usuario:",
        businessUserError
      );

      return NextResponse.json(
        {
          error:
            "No se pudo determinar el negocio asociado.",
        },
        { status: 500 }
      );
    }

    if (!businessUser) {
      return NextResponse.json(
        {
          error:
            "No encontramos un negocio asociado a tu cuenta.",
        },
        { status: 403 }
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

    const { data: updatedBusiness, error: updateError } =
      await supabaseAdmin
        .from("businesses")
        .update({
          name,
          google_url: googleUrl || null,
          instagram_url: instagramUrl || null,
          whatsapp: convertirWhatsApp(whatsapp),
          logo_url: logoUrl || null,
        })
        .eq("id", businessUser.business_id)
        .select(
          "id, name, slug, google_url, instagram_url, whatsapp, logo_url"
        )
        .single();

    if (updateError) {
      console.error(
        "Error actualizando negocio:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "No pudimos guardar los cambios.",
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
      "Error en PUT /api/panel/configuracion:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}