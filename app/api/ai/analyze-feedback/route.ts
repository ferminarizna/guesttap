import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

type Topic =
  | "atencion"
  | "tiempo"
  | "calidad"
  | "producto_servicio"
  | "precio_valor"
  | "disponibilidad"
  | "cumplimiento"
  | "comunicacion"
  | "limpieza_orden"
  | "comodidad_ambiente"
  | "experiencia_general";

type Sentiment =
  | "positivo"
  | "neutral"
  | "negativo";

type Severity =
  | "baja"
  | "media"
  | "alta";

type Analysis = {
  tema: Topic;
  etiqueta_tema: string;
  subtema: string;
  sentimiento: Sentiment;
  severidad: Severity;
  confianza: number;
  objeto_afectado: string;
  resumen: string;
  evidencia: string;
  merece_atencion: boolean;
  es_observacion_aislada: boolean;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function detectTopic(text: string) {
  if (
    containsAny(text, [
      "no tienen",
      "no hay",
      "agotado",
      "agotada",
      "sin stock",
      "stock",
      "disponible",
      "disponibilidad",
      "falta",
      "faltan",
    ])
  ) {
    let objeto = "general";

    if (text.includes("encendedor")) {
      objeto = "encendedores";
    } else if (text.includes("producto")) {
      objeto = "productos";
    }

    return {
      tema: "disponibilidad" as Topic,
      etiqueta: "Disponibilidad",
      subtema: "disponibilidad de productos o elementos",
      objeto,
    };
  }

  if (
    containsAny(text, [
      "malo",
      "mala",
      "pesimo",
      "pesima",
      "horrible",
      "defectuoso",
      "defectuosa",
      "roto",
      "rota",
      "funciona mal",
      "funcionan mal",
      "calidad",
    ])
  ) {
    let objeto = "general";

    if (text.includes("porro")) {
      objeto = "porro";
    } else if (text.includes("encendedor")) {
      objeto = "encendedores";
    } else if (text.includes("producto")) {
      objeto = "producto";
    }

    return {
      tema: "calidad" as Topic,
      etiqueta: "Calidad",
      subtema: "calidad del producto o servicio",
      objeto,
    };
  }

  if (
    containsAny(text, [
      "caro",
      "cara",
      "precio",
      "barato",
      "barata",
      "valor",
    ])
  ) {
    return {
      tema: "precio_valor" as Topic,
      etiqueta: "Precio y valor",
      subtema: "percepción de precio o valor",
      objeto: "general",
    };
  }

  if (
    containsAny(text, [
      "espera",
      "esperar",
      "demora",
      "demorado",
      "demorada",
      "tardo",
      "tarde",
    ])
  ) {
    return {
      tema: "tiempo" as Topic,
      etiqueta: "Tiempo",
      subtema: "tiempo de espera o respuesta",
      objeto: "general",
    };
  }

  if (
    containsAny(text, [
      "atencion",
      "empleado",
      "empleados",
      "vendedor",
      "vendedora",
      "trato",
      "atendieron",
    ])
  ) {
    return {
      tema: "atencion" as Topic,
      etiqueta: "Atención",
      subtema: "atención del personal",
      objeto: "personal",
    };
  }

  if (
    containsAny(text, [
      "sucio",
      "sucia",
      "suciedad",
      "limpio",
      "limpia",
      "limpieza",
      "orden",
      "desorden",
    ])
  ) {
    return {
      tema: "limpieza_orden" as Topic,
      etiqueta: "Limpieza y orden",
      subtema: "limpieza y orden",
      objeto: "general",
    };
  }

  if (
    containsAny(text, [
      "mensaje",
      "informacion",
      "avisaron",
      "comunicaron",
      "comunicacion",
    ])
  ) {
    return {
      tema: "comunicacion" as Topic,
      etiqueta: "Comunicación",
      subtema: "información y comunicación",
      objeto: "general",
    };
  }

  if (
    containsAny(text, [
      "feo",
      "fea",
      "estetica",
      "decoracion",
      "ambiente",
      "musica",
      "ruido",
    ])
  ) {
    let objeto = "general";

    if (text.includes("cenicero")) {
      objeto = "ceniceros";
    } else if (text.includes("musica")) {
      objeto = "musica";
    }

    return {
      tema: "comodidad_ambiente" as Topic,
      etiqueta: "Comodidad y ambiente",
      subtema: "ambiente y estética",
      objeto,
    };
  }

  return {
    tema: "experiencia_general" as Topic,
    etiqueta: "Experiencia general",
    subtema: "experiencia general",
    objeto: "general",
  };
}

function detectSentiment(text: string): Sentiment {
  const negativeWords = [
    "malo",
    "mala",
    "pesimo",
    "pesima",
    "horrible",
    "feo",
    "fea",
    "caro",
    "cara",
    "no hay",
    "no tienen",
    "falta",
    "faltan",
    "roto",
    "rota",
    "sucio",
    "sucia",
    "demora",
    "demorado",
    "demorada",
    "mal",
  ];

  const positiveWords = [
    "excelente",
    "excelentes",
    "bueno",
    "buena",
    "buenisimo",
    "buenisima",
    "genial",
    "perfecto",
    "perfecta",
    "me encanta",
    "recomiendo",
    "recomendable",
  ];

  if (containsAny(text, negativeWords)) {
    return "negativo";
  }

  if (containsAny(text, positiveWords)) {
    return "positivo";
  }

  return "neutral";
}

function detectSeverity(
  sentiment: Sentiment,
  text: string
): Severity {
  if (sentiment !== "negativo") {
    return "baja";
  }

  if (
    containsAny(text, [
      "peligro",
      "peligroso",
      "estafa",
      "roto",
      "rota",
      "nunca",
      "jamas",
      "pesimo",
      "pesima",
      "horrible",
    ])
  ) {
    return "alta";
  }

  if (
    containsAny(text, [
      "malo",
      "mala",
      "caro",
      "cara",
      "no tienen",
      "no hay",
      "falta",
      "faltan",
      "demora",
      "feo",
      "fea",
    ])
  ) {
    return "media";
  }

  return "baja";
}

function buildAnalysis(message: string): Analysis {
  const normalized = normalize(message);

  const topic = detectTopic(normalized);
  const sentimiento = detectSentiment(normalized);
  const severidad = detectSeverity(
    sentimiento,
    normalized
  );

  let confianza = 0.62;

  if (topic.tema !== "experiencia_general") {
    confianza = 0.86;
  }

  if (normalized.length < 12) {
    confianza = 0.55;
  }

  let resumen =
    `El comentario se relaciona con ${topic.subtema}.`;

  if (sentimiento === "negativo") {
    resumen =
      `El cliente expresa una observación negativa relacionada con ${topic.subtema}.`;
  }

  if (sentimiento === "positivo") {
    resumen =
      `El cliente expresa una valoración positiva relacionada con ${topic.subtema}.`;
  }

  return {
    tema: topic.tema,
    etiqueta_tema: topic.etiqueta,
    subtema: topic.subtema,
    sentimiento,
    severidad,
    confianza,
    objeto_afectado: topic.objeto,
    resumen,
    evidencia: message.trim(),
    merece_atencion: sentimiento === "negativo",
    es_observacion_aislada: true,
  };
}

export async function POST(request: Request) {
  try {
    const contentType =
      request.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          ok: false,
          error: "La solicitud debe utilizar JSON.",
        },
        { status: 415 }
      );
    }

    const body = await request.json();

    const feedbackId =
      typeof body?.feedbackId === "number"
        ? body.feedbackId
        : null;

    const businessId =
      typeof body?.businessId === "number"
        ? body.businessId
        : null;

    /*
     * =========================================================
     * ANALIZAR TODOS LOS COMENTARIOS PENDIENTES DE UN NEGOCIO
     * =========================================================
     */

    if (
      businessId !== null &&
      feedbackId === null
    ) {
      if (
        !Number.isInteger(businessId) ||
        businessId <= 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "businessId inválido.",
          },
          { status: 400 }
        );
      }

      const { data: business, error: businessError } =
        await supabaseAdmin
          .from("businesses")
          .select("id, name, business_type")
          .eq("id", businessId)
          .maybeSingle();

      if (businessError) {
        console.error(
          "Error obteniendo negocio:",
          businessError
        );

        return NextResponse.json(
          {
            ok: false,
            error: "No se pudo obtener el negocio.",
          },
          { status: 500 }
        );
      }

      if (!business) {
        return NextResponse.json(
          {
            ok: false,
            error: "Negocio no encontrado.",
          },
          { status: 404 }
        );
      }

      const { data: feedbackList, error: feedbackError } =
        await supabaseAdmin
          .from("feedback")
          .select(
            "id, business_id, message, rating, created_at"
          )
          .eq("business_id", businessId)
          .not("message", "is", null)
          .order("created_at", {
            ascending: true,
          });

      if (feedbackError) {
        console.error(
          "Error obteniendo feedback:",
          feedbackError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "No se pudo obtener el feedback del negocio.",
          },
          { status: 500 }
        );
      }

      const feedbackWithMessages =
        (feedbackList || []).filter(
          (item) =>
            typeof item.message === "string" &&
            item.message.trim().length > 0
        );

      if (feedbackWithMessages.length === 0) {
        return NextResponse.json({
          ok: true,
          businessId,
          analyzed: 0,
          skipped: 0,
          totalWithComments: 0,
          message:
            "El negocio todavía no tiene comentarios para analizar.",
        });
      }

      const feedbackIds =
        feedbackWithMessages.map(
          (item) => item.id
        );

      const { data: existingAnalyses, error: existingError } =
        await supabaseAdmin
          .from("feedback_ai_analysis")
          .select("feedback_id")
          .eq("business_id", businessId)
          .in("feedback_id", feedbackIds);

      if (existingError) {
        console.error(
          "Error comprobando análisis existentes:",
          existingError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "No se pudieron comprobar los análisis existentes.",
          },
          { status: 500 }
        );
      }

      const alreadyAnalyzedIds = new Set(
        (existingAnalyses || []).map(
          (item) => item.feedback_id
        )
      );

      const pendingFeedback =
        feedbackWithMessages.filter(
          (item) =>
            !alreadyAnalyzedIds.has(item.id)
        );

      if (pendingFeedback.length === 0) {
        return NextResponse.json({
          ok: true,
          businessId,
          analyzed: 0,
          skipped:
            feedbackWithMessages.length,
          totalWithComments:
            feedbackWithMessages.length,
          message:
            "Todos los comentarios ya tienen análisis.",
        });
      }

      const rowsToInsert =
        pendingFeedback.map((feedback) => {
          const analysis = buildAnalysis(
            feedback.message as string
          );

          return {
            feedback_id: feedback.id,
            business_id: business.id,
            business_type:
              business.business_type || "other",

            tema: analysis.tema,
            etiqueta_tema:
              analysis.etiqueta_tema,
            subtema:
              analysis.subtema,

            sentimiento:
              analysis.sentimiento,
            severidad:
              analysis.severidad,

            confianza:
              analysis.confianza,

            objeto_afectado:
              analysis.objeto_afectado,

            resumen:
              analysis.resumen,

            evidencia:
              analysis.evidencia,

            merece_atencion:
              analysis.merece_atencion,

            es_observacion_aislada:
              true,

            engine:
              "guesttap-local-v1",
          };
        });

      const {
        data: insertedAnalyses,
        error: insertError,
      } = await supabaseAdmin
        .from("feedback_ai_analysis")
        .insert(rowsToInsert)
        .select("id, feedback_id");

      if (insertError) {
        console.error(
          "Error guardando análisis:",
          insertError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "No se pudieron guardar los análisis.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        businessId,
        analyzed:
          insertedAnalyses?.length || 0,
        skipped:
          alreadyAnalyzedIds.size,
        totalWithComments:
          feedbackWithMessages.length,
        message:
          "Los comentarios fueron analizados correctamente.",
      });
    }

    /*
     * =========================================================
     * ANALIZAR UN FEEDBACK ESPECÍFICO
     * =========================================================
     */

    if (feedbackId !== null) {
      if (
        !Number.isInteger(feedbackId) ||
        feedbackId <= 0
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: "feedbackId inválido.",
          },
          { status: 400 }
        );
      }

      const { data: feedback, error: feedbackError } =
        await supabaseAdmin
          .from("feedback")
          .select(
            "id, business_id, message, rating"
          )
          .eq("id", feedbackId)
          .maybeSingle();

      if (feedbackError) {
        console.error(
          "Error obteniendo feedback:",
          feedbackError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "No se pudo obtener el feedback.",
          },
          { status: 500 }
        );
      }

      if (!feedback) {
        return NextResponse.json(
          {
            ok: false,
            error: "Feedback no encontrado.",
          },
          { status: 404 }
        );
      }

      if (
        typeof feedback.message !== "string" ||
        !feedback.message.trim()
      ) {
        return NextResponse.json({
          ok: true,
          analyzed: false,
          reason: "feedback_without_message",
        });
      }

      const { data: business, error: businessError } =
        await supabaseAdmin
          .from("businesses")
          .select("id, business_type")
          .eq("id", feedback.business_id)
          .maybeSingle();

      if (businessError || !business) {
        console.error(
          "Error obteniendo negocio:",
          businessError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "No se pudo obtener el negocio asociado.",
          },
          { status: 500 }
        );
      }

      const {
        data: existingAnalysis,
        error: existingError,
      } = await supabaseAdmin
        .from("feedback_ai_analysis")
        .select("id")
        .eq("feedback_id", feedback.id)
        .maybeSingle();

      if (existingError) {
        console.error(
          "Error comprobando análisis:",
          existingError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "No se pudo comprobar si el feedback ya fue analizado.",
          },
          { status: 500 }
        );
      }

      if (existingAnalysis) {
        return NextResponse.json({
          ok: true,
          analyzed: true,
          alreadyAnalyzed: true,
          analysisId: existingAnalysis.id,
        });
      }

      const analysis = buildAnalysis(
        feedback.message
      );

      const {
        data: savedAnalysis,
        error: analysisError,
      } = await supabaseAdmin
        .from("feedback_ai_analysis")
        .insert({
          feedback_id: feedback.id,
          business_id: business.id,
          business_type:
            business.business_type || "other",

          tema: analysis.tema,
          etiqueta_tema:
            analysis.etiqueta_tema,
          subtema:
            analysis.subtema,

          sentimiento:
            analysis.sentimiento,
          severidad:
            analysis.severidad,

          confianza:
            analysis.confianza,

          objeto_afectado:
            analysis.objeto_afectado,

          resumen:
            analysis.resumen,

          evidencia:
            analysis.evidencia,

          merece_atencion:
            analysis.merece_atencion,

          es_observacion_aislada:
            true,

          engine:
            "guesttap-local-v1",
        })
        .select("id")
        .single();

      if (analysisError) {
        console.error(
          "Error guardando análisis:",
          analysisError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "El feedback fue encontrado, pero no se pudo guardar su análisis.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        analyzed: true,
        alreadyAnalyzed: false,
        analysisId: savedAnalysis.id,
        analysis,
      });
    }

    /*
     * =========================================================
     * PRUEBA MANUAL
     * =========================================================
     */

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Falta el comentario del cliente.",
        },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "El comentario supera el límite permitido.",
        },
        { status: 400 }
      );
    }

    const analysis = buildAnalysis(message);

    return NextResponse.json({
      ok: true,
      analyzed: false,
      analysis,
      meta: {
        engine: "guesttap-local-v1",
        recurrentProblemDetected: false,
        recurrenceEvaluated: false,
      },
    });
  } catch (error) {
    console.error(
      "GuestTap AI error:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "No se pudo analizar el comentario.",
      },
      { status: 500 }
    );
  }
}