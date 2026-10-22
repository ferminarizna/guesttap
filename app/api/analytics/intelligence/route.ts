import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Faltan las variables de entorno de Supabase.");
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

type SignalStatus =
  | "attention"
  | "emerging"
  | "signal"
  | "strength";

type AnalysisRow = {
  feedback_id: number;
  business_id: number;
  tema: string | null;
  etiqueta_tema: string | null;
  subtema: string | null;
  sentimiento: string | null;
  severidad: string | null;
  confianza: number | null;
  evidencia: string | null;
  created_at: string;
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

async function calcularInteligencia(
  businessId: number
) {
  const { data, error } = await supabaseAdmin
    .from("feedback_ai_analysis")
    .select(
      `
      feedback_id,
      business_id,
      tema,
      etiqueta_tema,
      subtema,
      sentimiento,
      severidad,
      confianza,
      evidencia,
      created_at
      `
    )
    .eq("business_id", businessId)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Error obteniendo feedback_ai_analysis:",
      error
    );

    throw new Error(
      "No se pudieron obtener los análisis."
    );
  }

  const rows = (data || []) as AnalysisRow[];

  if (rows.length === 0) {
    return {
      ok: true,
      businessId,
      totalAnalyses: 0,
      signals: [],
      attentionSignals: [],
      emergingSignals: [],
      strengthSignals: [],
      primaryInsight: null,
    };
  }

  const groups = new Map<
    string,
    AnalysisRow[]
  >();

  for (const row of rows) {
    const key =
      row.tema || "experiencia_general";

    const current = groups.get(key) || [];

    current.push(row);

    groups.set(key, current);
  }

  const signals = Array.from(groups.entries())
    .map(([key, items]) => {
      const count = items.length;

      const negativeCount = items.filter(
        (item) =>
          item.sentimiento === "negativo"
      ).length;

      const positiveCount = items.filter(
        (item) =>
          item.sentimiento === "positivo"
      ).length;

      const neutralCount = items.filter(
        (item) =>
          item.sentimiento === "neutral"
      ).length;

      const negativeRate =
        count > 0
          ? (negativeCount / count) * 100
          : 0;

      const averageConfidence =
        count > 0
          ? items.reduce(
              (sum, item) =>
                sum +
                Number(item.confianza || 0),
              0
            ) / count
          : 0;

      let status: SignalStatus = "signal";

      if (
        count >= 3 &&
        negativeCount >= 2
      ) {
        status = "attention";
      } else if (
        count >= 5 &&
        negativeRate >= 50
      ) {
        status = "attention";
      } else if (
        count >= 2 &&
        positiveCount >= 2 &&
        positiveCount > negativeCount
      ) {
        status = "strength";
      } else if (count >= 2) {
        status = "emerging";
      }

      const first = items[0];

      return {
        key,
        title:
          first.etiqueta_tema ||
          key,
        subtopic:
          first.subtema ||
          "Experiencia general",

        count,
        negativeCount,
        positiveCount,
        neutralCount,

        negativeRate:
          Math.round(negativeRate),

        averageConfidence:
          round(averageConfidence),

        status,

        evidence: items
          .slice(0, 5)
          .map((item) => ({
            feedbackId:
              item.feedback_id,
            message:
              item.evidencia || "",
            sentiment:
              item.sentimiento || "neutral",
            severity:
              item.severidad || "baja",
            confidence:
              Number(
                item.confianza || 0
              ),
          })),
      };
    })
    .sort((a, b) => {
      const priority: Record<
        SignalStatus,
        number
      > = {
        attention: 4,
        strength: 3,
        emerging: 2,
        signal: 1,
      };

      return (
        priority[b.status] -
          priority[a.status] ||
        b.count - a.count
      );
    });

  const attentionSignals =
    signals.filter(
      (signal) =>
        signal.status === "attention"
    );

  const emergingSignals =
    signals.filter(
      (signal) =>
        signal.status === "emerging"
    );

  const strengthSignals =
    signals.filter(
      (signal) =>
        signal.status === "strength"
    );

  const usableSignals =
    signals.filter(
      (signal) =>
        signal.key !==
        "experiencia_general"
    );

  let primaryInsight = null;

  const attention =
    attentionSignals.find(
      (signal) =>
        signal.key !==
        "experiencia_general"
    );

  if (attention) {
    primaryInsight = {
      type: "attention",
      title:
        `${attention.title} merece atención.`,
      description:
        `El tema aparece ${attention.count} veces y ${attention.negativeCount} de esas menciones son negativas.`,
      metric:
        `${attention.count} menciones`,
      supporting:
        `${attention.negativeCount} negativas · ${attention.negativeRate}% negativas`,
      confidence:
        attention.averageConfidence,
    };
  }

  if (!primaryInsight) {
    const strength =
      strengthSignals.find(
        (signal) =>
          signal.key !==
          "experiencia_general"
      );

    if (strength) {
      primaryInsight = {
        type: "strength",
        title:
          `${strength.title} aparece como fortaleza.`,
        description:
          `El tema acumula ${strength.count} menciones con predominio positivo.`,
        metric:
          `${strength.count} menciones`,
        supporting:
          `${strength.positiveCount} positivas`,
        confidence:
          strength.averageConfidence,
      };
    }
  }

  if (!primaryInsight) {
    const emerging =
      emergingSignals.find(
        (signal) =>
          signal.key !==
          "experiencia_general"
      );

    if (emerging) {
      primaryInsight = {
        type: "emerging",
        title:
          `${emerging.title} está empezando a aparecer.`,
        description:
          `Hay ${emerging.count} menciones relacionadas, pero todavía no hay evidencia suficiente para considerarlo un problema recurrente.`,
        metric:
          `${emerging.count} menciones`,
        supporting:
          `${emerging.negativeCount} negativas`,
        confidence:
          emerging.averageConfidence,
      };
    }
  }

  if (!primaryInsight) {
    primaryInsight = {
      type: "observation",
      title:
        "GuestTap ya está capturando señales.",
      description:
        "Todavía no aparece un patrón suficientemente fuerte como para declarar un problema recurrente.",
      metric:
        `${rows.length} análisis`,
      supporting:
        "evidencia disponible",
      confidence:
        usableSignals[0]
          ?.averageConfidence || 0,
    };
  }

  return {
    ok: true,
    businessId,
    totalAnalyses: rows.length,
    signals,
    attentionSignals,
    emergingSignals,
    strengthSignals,
    primaryInsight,
  };
}

async function obtenerBusinessId(
  request: Request
) {
  const url = new URL(request.url);

  const queryId =
    url.searchParams.get("businessId");

  if (queryId) {
    return Number(queryId);
  }

  try {
    const body = await request.json();

    if (
      typeof body?.businessId === "number"
    ) {
      return body.businessId;
    }
  } catch {
    // No hay body JSON.
  }

  return null;
}

export async function GET(
  request: Request
) {
  try {
    const businessId =
      await obtenerBusinessId(request);

    if (
      !Number.isInteger(businessId) ||
      businessId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta un businessId válido.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      await calcularInteligencia(
        businessId
      )
    );
  } catch (error) {
    console.error(
      "GuestTap Intelligence GET error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error calculando inteligencia.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    const businessId =
      await obtenerBusinessId(request);

    if (
      !Number.isInteger(businessId) ||
      businessId <= 0
    ) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta un businessId válido.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      await calcularInteligencia(
        businessId
      )
    );
  } catch (error) {
    console.error(
      "GuestTap Intelligence POST error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Error calculando inteligencia.",
      },
      { status: 500 }
    );
  }
}