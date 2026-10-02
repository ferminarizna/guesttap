import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

const ADMIN_EMAIL = "ariznafermin@gmail.com";

async function verificarAdministrador(request: NextRequest) {
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
    error: userError,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (userError || !user) {
    console.error("Error verificando sesión:", userError);

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
    console.error(
      `Acceso administrativo rechazado para: ${
        userEmail || "sin email"
      }`
    );

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

export async function GET(request: NextRequest) {
  try {
    const auth = await verificarAdministrador(request);

    if (auth.response) {
      return auth.response;
    }

    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 100,
      });

    if (usersError) {
      console.error("Error obteniendo usuarios:", usersError);

      return NextResponse.json(
        { error: "No se pudieron obtener los usuarios." },
        { status: 500 }
      );
    }

    const { data: associations, error: associationsError } =
      await supabaseAdmin
        .from("business_users")
        .select("id, user_id, business_id, created_at")
        .order("created_at", { ascending: false });

    if (associationsError) {
      console.error(
        "Error obteniendo asociaciones:",
        associationsError
      );

      return NextResponse.json(
        { error: "No se pudieron obtener las asociaciones." },
        { status: 500 }
      );
    }

    const { data: businesses, error: businessesError } =
      await supabaseAdmin
        .from("businesses")
        .select("id, name")
        .order("name", { ascending: true });

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

    const users = usersData.users.map((user) => ({
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
    }));

    return NextResponse.json({
      users,
      businesses: businesses || [],
      associations: associations || [],
    });
  } catch (error) {
    console.error("Error en GET business-users:", error);

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verificarAdministrador(request);

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const userId = body?.user_id;
    const businessId = body?.business_id;

    if (!userId || !businessId) {
      return NextResponse.json(
        {
          error: "user_id y business_id son obligatorios.",
        },
        { status: 400 }
      );
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "El usuario no existe." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } =
      await supabaseAdmin
        .from("businesses")
        .select("id")
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

    const { data, error } = await supabaseAdmin
      .from("business_users")
      .insert({
        user_id: userId,
        business_id: businessId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error:
              "Ese usuario ya está asociado a ese negocio.",
          },
          { status: 409 }
        );
      }

      if (error.code === "23503") {
        return NextResponse.json(
          {
            error:
              "El usuario o el negocio no existe.",
          },
          { status: 400 }
        );
      }

      console.error(
        "Error creando business_users:",
        error
      );

      return NextResponse.json(
        { error: "No se pudo crear la asociación." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Error en POST business-users:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verificarAdministrador(request);

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const userId = body?.user_id;
    const businessId = body?.business_id;

    if (!userId || !businessId) {
      return NextResponse.json(
        {
          error: "user_id y business_id son obligatorios.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("business_users")
      .delete()
      .eq("user_id", userId)
      .eq("business_id", businessId);

    if (error) {
      console.error(
        "Error eliminando asociación:",
        error
      );

      return NextResponse.json(
        { error: "No se pudo eliminar la asociación." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Error en DELETE business-users:",
      error
    );

    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}