import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verificarAdministrador } from "../../../../lib/admin-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ACTIVATION_REDIRECT_URL =
  "https://guesttap-five.vercel.app/activar-cuenta";

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

export async function POST(request: NextRequest) {
  try {
    const auth = await verificarAdministrador(request);

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const businessId =
      typeof body.business_id === "number"
        ? body.business_id
        : Number(body.business_id);

    if (
      !email ||
      !email.includes("@") ||
      email.length > 254
    ) {
      return NextResponse.json(
        { error: "Ingresá un email válido." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(businessId) ||
      businessId <= 0
    ) {
      return NextResponse.json(
        { error: "Seleccioná un negocio válido." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } =
      await supabaseAdmin
        .from("businesses")
        .select("id, name")
        .eq("id", businessId)
        .maybeSingle();

    if (businessError) {
      console.error(
        "Error verificando negocio:",
        businessError
      );

      return NextResponse.json(
        { error: "No se pudo verificar el negocio." },
        { status: 500 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "El negocio no existe." },
        { status: 400 }
      );
    }

    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });

    if (usersError) {
      console.error(
        "Error obteniendo usuarios:",
        usersError
      );

      return NextResponse.json(
        { error: "No se pudo verificar el usuario." },
        { status: 500 }
      );
    }

    let user = usersData.users.find(
      (existingUser) =>
        existingUser.email?.trim().toLowerCase() === email
    );

    if (!user) {
      const {
        data: createdUser,
        error: createUserError,
      } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
      });

      if (createUserError || !createdUser.user) {
        console.error(
          "Error creando usuario:",
          createUserError
        );

        return NextResponse.json(
          { error: "No se pudo crear el cliente." },
          { status: 500 }
        );
      }

      user = createdUser.user;
    }

    const { error: associationError } =
      await supabaseAdmin
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
      console.error(
        "Error creando asociación:",
        associationError
      );

      return NextResponse.json(
        { error: "No se pudo asociar el cliente." },
        { status: 500 }
      );
    }

    const {
      data: link,
      error: linkError,
    } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: ACTIVATION_REDIRECT_URL,
      },
    });

    if (linkError) {
      console.error(
        "Error generando enlace de activación:",
        linkError
      );

      return NextResponse.json({
        success: true,
        email,
        business: business.name,
        activationLink: null,
        warning:
          "El cliente fue creado/asociado, pero no se pudo generar el enlace de activación.",
      });
    }

    return NextResponse.json({
      success: true,
      email,
      business: business.name,
      activationLink:
        link?.properties?.action_link || null,
    });
  } catch (error) {
    console.error(
      "Error en POST /api/admin/clientes:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}