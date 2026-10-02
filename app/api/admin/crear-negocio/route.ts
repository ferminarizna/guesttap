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

function generarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function convertirWhatsApp(valor: string) {
  const numero = valor.replace(/\D/g, "");

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

export async function POST(request: NextRequest) {
  try {
    const auth = await verificarAdministrador(request);

    if (auth.response) {
      return auth.response;
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
        { error: "Ingresá el nombre del negocio." },
        { status: 400 }
      );
    }

    const slug = generarSlug(name);

    if (!slug) {
      return NextResponse.json(
        { error: "No se pudo generar un slug válido." },
        { status: 400 }
      );
    }

    const { data: negocioExistente, error: slugError } =
      await supabaseAdmin
        .from("businesses")
        .select("id, name")
        .eq("slug", slug)
        .maybeSingle();

    if (slugError) {
      console.error(
        "Error verificando slug:",
        slugError
      );

      return NextResponse.json(
        { error: "No se pudo verificar el negocio." },
        { status: 500 }
      );
    }

    if (negocioExistente) {
      return NextResponse.json(
        {
          error: `Ya existe un negocio con ese nombre o slug: ${negocioExistente.name}.`,
        },
        { status: 409 }
      );
    }

    const { data: negocio, error } =
      await supabaseAdmin
        .from("businesses")
        .insert({
          name,
          slug,
          google_url: googleUrl || null,
          instagram_url: instagramUrl || null,
          whatsapp: convertirWhatsApp(whatsapp),
          logo_url: logoUrl || null,
        })
        .select(
          "id, name, slug, google_url, instagram_url, whatsapp, logo_url"
        )
        .single();

    if (error) {
      console.error(
        "Error creando negocio:",
        error
      );

      return NextResponse.json(
        { error: "No se pudo crear el negocio." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        business: negocio,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error en POST /api/admin/crear-negocio:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}