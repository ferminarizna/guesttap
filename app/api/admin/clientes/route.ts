import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || !serviceRoleKey) {
  throw new Error("Faltan variables de entorno de Supabase.");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const admin = createClient(supabaseUrl, serviceRoleKey);

async function verificarAdmin(request: NextRequest) {
  const auth = request.headers.get("authorization");

  if (!auth?.startsWith("Bearer ")) {
    return false;
  }

  const token = auth.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  return !error && user?.email === "ariznafermin@gmail.com";
}

export async function POST(request: NextRequest) {
  try {
    if (!(await verificarAdmin(request))) {
      return NextResponse.json(
        { error: "No autorizado." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const businessId = Number(body.business_id);

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Ingresá un email válido." },
        { status: 400 }
      );
    }

    if (!businessId) {
      return NextResponse.json(
        { error: "Seleccioná un negocio." },
        { status: 400 }
      );
    }

    const { data: business } = await admin
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .maybeSingle();

    if (!business) {
      return NextResponse.json(
        { error: "El negocio no existe." },
        { status: 400 }
      );
    }

    const { data: users } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100,
    });

    let user = users?.users.find(
      (u) => u.email?.toLowerCase() === email
    );

    if (!user) {
      const result = await admin.auth.admin.createUser({
        email,
        email_confirm: false,
      });

      if (result.error || !result.data.user) {
        return NextResponse.json(
          { error: "No se pudo crear el cliente." },
          { status: 500 }
        );
      }

      user = result.data.user;
    }

    const { error: associationError } = await admin
      .from("business_users")
      .upsert(
        {
          user_id: user.id,
          business_id: businessId,
        },
        {
          onConflict: "user_id,business_id",
        }
      );

    if (associationError) {
      console.error(associationError);

      return NextResponse.json(
        { error: "No se pudo asociar el cliente." },
        { status: 500 }
      );
    }

    const { data: link, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "invite",
        email,
        options: {
          redirectTo:
            "https://guesttap-five.vercel.app/activar-cuenta",
        },
      });

    if (linkError) {
      console.error(linkError);
    }

    return NextResponse.json({
      success: true,
      email,
      business: business.name,
      activationLink:
        link?.properties?.action_link || null,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}