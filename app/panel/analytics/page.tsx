"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: number;
  name: string;
  logo_url: string | null;
};

type ScanEvent = {
  id: number;
  source: string;
  created_at: string;
};

type Feedback = {
  id: number;
  rating: number;
  message: string | null;
  created_at: string;
  scan_event_id: number | null;
};

type IntelligenceSignal = {
  key: string;
  title: string;
  count: number;
  severity: "signal" | "recurrent";
  evidence: Feedback[];
};

const intelligenceTopics = [
  {
    key: "music",
    title: "Música y volumen",
    keywords: ["musica", "volumen", "ruido", "sonido", "audio"],
  },
  {
    key: "wait",
    title: "Tiempos de espera",
    keywords: ["espera", "demora", "tarde", "lento", "rapido"],
  },
  {
    key: "attention",
    title: "Atención del personal",
    keywords: [
      "atencion",
      "personal",
      "empleado",
      "empleados",
      "mozo",
      "mozos",
      "servicio",
    ],
  },
  {
    key: "cleanliness",
    title: "Limpieza",
    keywords: [
      "limpieza",
      "sucio",
      "sucia",
      "suciedad",
      "higiene",
    ],
  },
  {
    key: "price",
    title: "Precio",
    keywords: [
      "precio",
      "caro",
      "cara",
      "barato",
      "costoso",
    ],
  },
  {
    key: "food",
    title: "Comida",
    keywords: [
      "comida",
      "plato",
      "platos",
      "sabor",
      "cocina",
    ],
  },
  {
    key: "space",
    title: "Ambiente y espacio",
    keywords: [
      "ambiente",
      "espacio",
      "lugar",
      "temperatura",
      "frio",
      "calor",
    ],
  },
] as const;

function normalizeIntelligenceText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function Icon({
  name,
  size = 20,
}: {
  name:
    | "activity"
    | "alert"
    | "arrow"
    | "scan"
    | "star"
    | "trend";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "activity") {
    return (
      <svg {...common}>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
    );
  }

  if (name === "scan") {
    return (
      <svg {...common}>
        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
        <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
        <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="M8 8h8v8H8z" />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg {...common}>
        <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
      </svg>
    );
  }

  if (name === "trend") {
    return (
      <svg {...common}>
        <path d="M3 17 9 11l4 4 8-9" />
        <path d="M16 6h5v5" />
      </svg>
    );
  }

  if (name === "alert") {
    return (
      <svg {...common}>
        <path d="M10.3 4.5 3.6 16a2 2 0 0 0 1.7 3h13.4a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 16h.01" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
  });
}

function formatFeedbackDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export default function AnalyticsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarAnalytics();
  }, []);

  async function cargarAnalytics() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No hay una sesión iniciada.");
        setLoading(false);
        return;
      }

      const { data: businessUser, error: businessUserError } =
        await supabase
          .from("business_users")
          .select("business_id")
          .eq("user_id", user.id)
          .single();

      if (businessUserError || !businessUser) {
        console.error(businessUserError);
        setError("No encontramos un negocio asociado a tu cuenta.");
        setLoading(false);
        return;
      }

      const { data: businessData, error: businessError } =
        await supabase
          .from("businesses")
          .select("id, name, logo_url")
          .eq("id", businessUser.business_id)
          .single();

      if (businessError || !businessData) {
        console.error(businessError);
        setError("No pudimos cargar tu negocio.");
        setLoading(false);
        return;
      }

      const { data: scanData, error: scanError } = await supabase
        .from("scan_events")
        .select("id, source, created_at")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

      if (scanError) {
        console.error(scanError);
        setError("No pudimos cargar los datos de escaneos.");
        setLoading(false);
        return;
      }

      const { data: feedbackData, error: feedbackError } =
        await supabase
          .from("feedback")
          .select(
            "id, rating, message, created_at, scan_event_id"
          )
          .eq("business_id", businessData.id)
          .order("created_at", { ascending: false });

      if (feedbackError) {
        console.error(feedbackError);
        setError("No pudimos cargar las valoraciones.");
        setLoading(false);
        return;
      }

      setBusiness(businessData);
      setScans(scanData || []);
      setFeedback(feedbackData || []);
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al cargar Analytics.");
    } finally {
      setLoading(false);
    }
  }

  const analytics = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const previousSevenDaysStart = new Date(sevenDaysAgo);
    previousSevenDaysStart.setDate(
      previousSevenDaysStart.getDate() - 7
    );

    const endOfToday = new Date(today);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const currentPeriodFeedback = feedback.filter((item) => {
      const date = new Date(item.created_at);

      return date >= sevenDaysAgo && date < endOfToday;
    });

    const previousPeriodFeedback = feedback.filter((item) => {
      const date = new Date(item.created_at);

      return date >= previousSevenDaysStart && date < sevenDaysAgo;
    });

    const currentAverage =
      currentPeriodFeedback.length >= 5
        ? currentPeriodFeedback.reduce(
            (total, item) => total + item.rating,
            0
          ) / currentPeriodFeedback.length
        : null;

    const previousAverage =
      previousPeriodFeedback.length >= 5
        ? previousPeriodFeedback.reduce(
            (total, item) => total + item.rating,
            0
          ) / previousPeriodFeedback.length
        : null;

    const satisfactionChange =
      currentAverage !== null && previousAverage !== null
        ? Number(
            (currentAverage - previousAverage).toFixed(1)
          )
        : null;

    const changeDetected =
      satisfactionChange !== null &&
      Math.abs(satisfactionChange) >= 0.5;

    const scansToday = scans.filter((scan) => {
      return new Date(scan.created_at) >= today;
    }).length;

    const scans7Days = scans.filter((scan) => {
      return new Date(scan.created_at) >= sevenDaysAgo;
    }).length;

    const previousScans7Days = scans.filter((scan) => {
      const date = new Date(scan.created_at);

      return (
        date >= previousSevenDaysStart &&
        date < sevenDaysAgo
      );
    }).length;

    const scanChange7Days =
      previousScans7Days > 0
        ? Math.round(
            ((scans7Days - previousScans7Days) /
              previousScans7Days) *
              100
          )
        : null;

    const scans30DaysList = scans.filter((scan) => {
      return new Date(scan.created_at) >= thirtyDaysAgo;
    });

    const scans30Days = scans30DaysList.length;

    const feedback30Days = feedback.filter((item) => {
      return new Date(item.created_at) >= thirtyDaysAgo;
    }).length;

    const averageRating =
      feedback.length > 0
        ? Number(
            (
              feedback.reduce(
                (total, item) => total + item.rating,
                0
              ) / feedback.length
            ).toFixed(1)
          )
        : null;

    const ratingDistribution = [5, 4, 3, 2, 1].map(
      (rating) => {
        const count = feedback.filter(
          (item) => item.rating === rating
        ).length;

        const percentage =
          feedback.length > 0
            ? Math.round(
                (count / feedback.length) * 100
              )
            : 0;

        return {
          rating,
          count,
          percentage,
        };
      }
    );

    const positiveFeedbackCount = feedback.filter(
      (item) => item.rating >= 4
    ).length;

    const criticalFeedbackCount = feedback.filter(
      (item) => item.rating <= 2
    ).length;

    const positiveFeedbackPercentage =
      feedback.length > 0
        ? Math.round(
            (positiveFeedbackCount / feedback.length) *
              100
          )
        : 0;

    const criticalFeedbackPercentage =
      feedback.length > 0
        ? Math.round(
            (criticalFeedbackCount / feedback.length) *
              100
          )
        : 0;

    const comments = feedback.filter(
      (item) =>
        typeof item.message === "string" &&
        item.message.trim().length > 0
    );

    const recentComments = comments.slice(0, 5);

    const criticalComments = comments
      .filter((item) => item.rating <= 2)
      .slice(0, 5);

    const intelligenceSignals: IntelligenceSignal[] =
      intelligenceTopics
        .map((topic) => {
          const matchingComments = comments.filter((item) => {
            if (!item.message) {
              return false;
            }

            const normalizedMessage =
              normalizeIntelligenceText(item.message);

            return topic.keywords.some((keyword) =>
              normalizedMessage.includes(keyword)
            );
          });

          if (matchingComments.length === 0) {
            return null;
          }

          return {
            key: topic.key,
            title: topic.title,
            count: matchingComments.length,
            severity:
              matchingComments.length >= 2
                ? "recurrent"
                : "signal",
            evidence: matchingComments.slice(0, 3),
          };
        })
        .filter(
          (signal): signal is IntelligenceSignal =>
            signal !== null
        )
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

    const scans30DaysIds = new Set(
      scans30DaysList.map((scan) => scan.id)
    );

    const convertedScans30Days = feedback.filter((item) => {
      return (
        item.scan_event_id !== null &&
        scans30DaysIds.has(item.scan_event_id)
      );
    }).length;

    const conversion =
      scans30Days > 0
        ? Math.min(
            Math.round(
              (convertedScans30Days / scans30Days) * 100
            ),
            100
          )
        : 0;

    const last7Days = Array.from(
      { length: 7 },
      (_, index) => {
        const date = new Date(sevenDaysAgo);

        date.setDate(
          sevenDaysAgo.getDate() + index
        );

        const key = getDayKey(date);

        const count = scans.filter((scan) => {
          return (
            getDayKey(new Date(scan.created_at)) ===
            key
          );
        }).length;

        return {
          key,
          date,
          count,
          label: formatDayLabel(date),
        };
      }
    );

    const maxDailyScans = Math.max(
      ...last7Days.map((item) => item.count),
      1
    );

    const scanChartPointList = last7Days.map(
      (day, index) => {
        const x = 35 + (index / 6) * 650;

        const y =
          220 -
          (day.count / maxDailyScans) * 165;

        return {
          x,
          y,
        };
      }
    );

    const scanChartPoints = scanChartPointList
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");

    const scanChartAreaPoints = [
      "35,220",
      scanChartPoints,
      "685,220",
    ].join(" ");

    const qrScans = scans.filter(
      (scan) =>
        (scan.source || "qr").toLowerCase() ===
        "qr"
    ).length;

    const nfcScans = scans.filter(
      (scan) =>
        (scan.source || "").toLowerCase() ===
        "nfc"
    ).length;

    return {
      scansTotal: scans.length,
      scansToday,
      scans7Days,
      scans30Days,
      feedbackTotal: feedback.length,
      feedback30Days,
      averageRating,
      ratingDistribution,
      positiveFeedbackCount,
      criticalFeedbackCount,
      positiveFeedbackPercentage,
      criticalFeedbackPercentage,
      comments,
      recentComments,
      criticalComments,
      intelligenceSignals,
      convertedScans30Days,
      conversion,
      last7Days,
      maxDailyScans,
      scanChartPointList,
      scanChartPoints,
      scanChartAreaPoints,
      previousScans7Days,
      scanChange7Days,
      qrScans,
      nfcScans,
      currentAverage,
      previousAverage,
      satisfactionChange,
      changeDetected,
      currentFeedbackCount:
        currentPeriodFeedback.length,
      previousFeedbackCount:
        previousPeriodFeedback.length,
    };
  }, [scans, feedback]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] p-3 sm:p-5">
        <div className="mx-auto max-w-[1440px]">
          <div className="min-h-[calc(100vh-24px)] overflow-hidden rounded-[28px] border border-neutral-200 bg-white sm:min-h-[calc(100vh-40px)]">
            <div className="animate-pulse p-5 sm:p-8">
              <div className="h-10 w-48 rounded-xl bg-neutral-200" />
              <div className="mt-3 h-4 w-72 rounded bg-neutral-100" />

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-32 rounded-2xl bg-neutral-100"
                  />
                ))}
              </div>

              <div className="mt-5 h-96 rounded-2xl bg-neutral-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-5">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold">
            No pudimos cargar Analytics
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error ||
              "No encontramos tu negocio."}
          </p>

          <a
            href="/panel"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Volver al panel
            <Icon name="arrow" size={15} />
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-4 sm:px-7 sm:py-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-base font-bold text-white">
                {business.name
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[9px]">
                GuestTap
              </p>

              <h1 className="truncate text-base font-semibold tracking-tight sm:text-xl">
                Analytics
              </h1>
            </div>
          </div>

          <a
            href="/panel"
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:px-4"
          >
            <span className="hidden sm:inline">
              Volver al panel
            </span>

            <span className="sm:hidden">
              Volver
            </span>

            <Icon name="arrow" size={14} />
          </a>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-7 sm:py-9 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              {business.name}
            </p>

            <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] sm:text-4xl">
              Analytics
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
              Entendé cómo interactúan tus
              clientes con tu GuestTap y cómo
              evoluciona su respuesta.
            </p>
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="scan" size={17} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Total
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {formatNumber(
                  analytics.scansTotal
                )}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                escaneos registrados
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="activity" size={17} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Hoy
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {formatNumber(
                  analytics.scansToday
                )}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                accesos durante hoy
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="trend" size={17} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  30 días
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {formatNumber(
                  analytics.scans30Days
                )}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                escaneos en el período
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="star" size={17} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Conversión
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {analytics.conversion}%
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                escaneo → valoración
              </p>
            </div>
          </section>

          <section className="mt-4">
            <div
              className={`rounded-[24px] border p-5 sm:p-6 ${
                analytics.changeDetected
                  ? "border-neutral-300 bg-neutral-50"
                  : "border-neutral-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    analytics.changeDetected
                      ? "bg-black text-white"
                      : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  <Icon
                    name={
                      analytics.changeDetected
                        ? "alert"
                        : "trend"
                    }
                    size={18}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                    Experiencia de clientes
                  </p>

                  {analytics.currentAverage ===
                    null ||
                  analytics.previousAverage ===
                    null ? (
                    <>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight">
                        Todavía estamos aprendiendo
                      </h3>

                      <p className="mt-1.5 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                        Necesitamos al menos 5
                        valoraciones en cada
                        período de 7 días para
                        detectar un cambio real
                        en la satisfacción.
                      </p>
                    </>
                  ) : analytics.changeDetected ? (
                    <>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight">
                        Detectamos un cambio
                      </h3>

                      <p className="mt-1.5 max-w-2xl text-xs leading-5 text-neutral-600 sm:text-sm sm:leading-6">
                        La satisfacción{" "}
                        {analytics.satisfactionChange! <
                        0
                          ? "bajó"
                          : "subió"}{" "}
                        {Math.abs(
                          analytics.satisfactionChange!
                        ).toFixed(1)}{" "}
                        estrellas durante los
                        últimos 7 días.
                      </p>

                      <p className="mt-2 text-xs font-medium text-neutral-500">
                        {analytics.previousAverage.toFixed(
                          1
                        )}{" "}
                        ⭐ →{" "}
                        {analytics.currentAverage.toFixed(
                          1
                        )}{" "}
                        ⭐ ·{" "}
                        {
                          analytics.currentFeedbackCount
                        }{" "}
                        valoraciones recientes
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-1 text-lg font-semibold tracking-tight">
                        La satisfacción está
                        estable
                      </h3>

                      <p className="mt-1.5 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                        No detectamos un cambio
                        relevante en la
                        satisfacción durante
                        los últimos 7 días.
                      </p>

                      <p className="mt-2 text-xs font-medium text-neutral-500">
                        {analytics.previousAverage.toFixed(
                          1
                        )}{" "}
                        ⭐ →{" "}
                        {analytics.currentAverage.toFixed(
                          1
                        )}{" "}
                        ⭐
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_0.75fr]">
            <div className="rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                    Actividad
                  </p>

                  <h3 className="mt-1 text-lg font-semibold tracking-tight">
                    Cómo está evolucionando tu
                    GuestTap
                  </h3>

                  <p className="mt-1.5 text-xs leading-5 text-neutral-500 sm:text-sm">
                    Escaneos registrados durante
                    los últimos 7 días.
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl bg-neutral-50 px-4 py-3 sm:min-w-[150px]">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                    Últimos 7 días
                  </p>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tracking-tight">
                      {formatNumber(
                        analytics.scans7Days
                      )}
                    </span>

                    <span className="text-xs text-neutral-500">
                      escaneos
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] font-medium text-neutral-400">
                    {analytics.previousScans7Days ===
                    0
                      ? analytics.scans7Days > 0
                        ? "Comenzó la actividad"
                        : "Sin actividad"
                      : `${
                          analytics.scanChange7Days! >
                          0
                            ? "+"
                            : ""
                        }${
                          analytics.scanChange7Days
                        }% vs. período anterior`}
                  </p>
                </div>
              </div>

              <div className="mt-7 overflow-hidden rounded-2xl bg-neutral-50/70 px-2 pt-5 sm:px-4">
                <svg
                  viewBox="0 0 700 250"
                  className="h-[245px] w-full"
                  role="img"
                  aria-label="Evolución de escaneos durante los últimos 7 días"
                >
                  {Array.from(
                    {
                      length:
                        analytics.maxDailyScans <=
                        3
                          ? analytics.maxDailyScans +
                            1
                          : 4,
                    },
                    (_, index) => index
                  ).map((step) => {
                    const levels =
                      analytics.maxDailyScans <= 3
                        ? analytics.maxDailyScans
                        : 3;

                    const y =
                      levels === 0
                        ? 220
                        : 220 -
                          (step / levels) *
                            165;

                    const value =
                      analytics.maxDailyScans <=
                      3
                        ? step
                        : Math.round(
                            (analytics.maxDailyScans /
                              3) *
                              step
                          );

                    return (
                      <g key={step}>
                        <line
                          x1="35"
                          x2="685"
                          y1={y}
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-neutral-200"
                        />

                        <text
                          x="0"
                          y={y + 4}
                          fontSize="10"
                          className="fill-neutral-400"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}

                  <polygon
                    points={
                      analytics.scanChartAreaPoints
                    }
                    fill="currentColor"
                    fillOpacity="0.04"
                    stroke="none"
                    className="text-black"
                  />

                  <polyline
                    points={
                      analytics.scanChartPoints
                    }
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-black"
                  />

                  {analytics.last7Days.map(
                    (day, index) => {
                      const point =
                        analytics
                          .scanChartPointList[
                          index
                        ];

                      return (
                        <g key={day.key}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="5"
                            fill="white"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            className="text-black"
                          />

                          <text
                            x={point.x}
                            y="243"
                            textAnchor="middle"
                            fontSize="10"
                            className="fill-neutral-400"
                          >
                            {day.label}
                          </text>
                        </g>
                      );
                    }
                  )}
                </svg>
              </div>
            </div>

            <div className="rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                Canales
              </p>

              <h3 className="mt-1 text-lg font-semibold tracking-tight">
                Cómo llegan tus clientes
              </h3>

              <div className="mt-7 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      QR
                    </span>

                    <span className="text-sm font-semibold">
                      {formatNumber(
                        analytics.qrScans
                      )}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width:
                          analytics.scansTotal >
                          0
                            ? `${
                                (analytics.qrScans /
                                  analytics.scansTotal) *
                                100
                              }%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      NFC
                    </span>

                    <span className="text-sm font-semibold">
                      {formatNumber(
                        analytics.nfcScans
                      )}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-500"
                      style={{
                        width:
                          analytics.scansTotal >
                          0
                            ? `${
                                (analytics.nfcScans /
                                  analytics.scansTotal) *
                                100
                              }%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-neutral-100 pt-5">
                <p className="text-xs leading-5 text-neutral-500">
                  NFC aparecerá automáticamente
                  cuando empecemos a registrar
                  interacciones provenientes de
                  etiquetas NFC.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                    Valoraciones
                  </p>

                  <h3 className="mt-1 text-lg font-semibold tracking-tight">
                    Qué tan satisfechos están
                  </h3>
                </div>

                <div className="text-right">
                  <p className="text-3xl font-semibold tracking-tight">
                    {analytics.averageRating !==
                    null
                      ? analytics.averageRating.toFixed(
                          1
                        )
                      : "—"}
                  </p>

                  <p className="mt-0.5 text-[10px] text-neutral-400">
                    promedio general
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-3">
                {analytics.ratingDistribution.map(
                  (item) => (
                    <div
                      key={item.rating}
                      className="flex items-center gap-3"
                    >
                      <div className="flex w-10 shrink-0 items-center gap-1 text-xs font-medium text-neutral-600">
                        <span>{item.rating}</span>

                        <span className="text-[11px]">
                          ★
                        </span>
                      </div>

                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-black transition-all"
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>

                      <span className="w-8 text-right text-xs font-semibold text-neutral-500">
                        {item.count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                Lectura rápida
              </p>

              <h3 className="mt-1 text-lg font-semibold tracking-tight">
                Cómo está respondiendo tu
                cliente
              </h3>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-neutral-400">
                    Positivas
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {
                      analytics.positiveFeedbackPercentage
                    }
                    %
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    4 y 5 estrellas
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-neutral-400">
                    Críticas
                  </p>

                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {
                      analytics.criticalFeedbackPercentage
                    }
                    %
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    1 y 2 estrellas
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-neutral-100 pt-5">
                <p className="text-xs leading-5 text-neutral-500">
                  {analytics.feedbackTotal ===
                  0
                    ? "Todavía no hay valoraciones para interpretar la experiencia."
                    : `${formatNumber(
                        analytics.feedbackTotal
                      )} valoraciones registradas. Esta distribución muestra dónde se concentra la percepción de tus clientes.`}
                </p>
              </div>
            </div>
          </section>

          {/* GuestTap Intelligence */}
          <section className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                  GuestTap Intelligence
                </p>

                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  Qué está empezando a aparecer
                </h3>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm">
                  Detectamos temas a partir de los comentarios reales de tus clientes.
                </p>
              </div>

              {analytics.intelligenceSignals.length > 0 && (
                <div className="text-xs font-medium text-neutral-400">
                  {analytics.intelligenceSignals.length}{" "}
                  {analytics.intelligenceSignals.length === 1
                    ? "señal"
                    : "señales"}
                </div>
              )}
            </div>

            {analytics.intelligenceSignals.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-neutral-50 px-5 py-7 text-center">
                <p className="text-sm font-medium text-neutral-700">
                  Todavía no hay suficiente información
                </p>

                <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                  Cuando aparezcan comentarios relacionados con un mismo tema, GuestTap podrá mostrar una señal.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 lg:grid-cols-2">
                {analytics.intelligenceSignals.map((signal) => (
                  <div
                    key={signal.key}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black text-white">
                          <Icon
                            name={
                              signal.severity === "recurrent"
                                ? "trend"
                                : "alert"
                            }
                            size={16}
                          />
                        </div>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-neutral-400">
                            {signal.severity === "recurrent"
                              ? "Tema recurrente"
                              : "Señal detectada"}
                          </p>

                          <h4 className="mt-1 text-base font-semibold tracking-tight">
                            {signal.title}
                          </h4>
                        </div>
                      </div>

                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-500 ring-1 ring-neutral-200">
                        {signal.count}{" "}
                        {signal.count === 1
                          ? "mención"
                          : "menciones"}
                      </span>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-neutral-500">
                      {signal.count === 1
                        ? "Este tema apareció en un comentario."
                        : `Este tema apareció en ${signal.count} comentarios.`}
                    </p>

                    <div className="mt-4 space-y-2">
                      {signal.evidence.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-xl border border-neutral-200 bg-white px-3.5 py-3"
                        >
                          <div className="flex items-center gap-1 text-[10px]">
                            {Array.from(
                              { length: 5 },
                              (_, index) => (
                                <span
                                  key={index}
                                  className={
                                    index < item.rating
                                      ? "text-black"
                                      : "text-neutral-300"
                                  }
                                >
                                  ★
                                </span>
                              )
                            )}
                          </div>

                          <p className="mt-2 text-xs leading-5 text-neutral-700">
                            “{item.message}”
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Voz del cliente */}
          <section className="mt-4 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                  Voz del cliente
                </p>

                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  Lo que están diciendo tus clientes
                </h3>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm">
                  Comentarios reales enviados a través
                  de tu GuestTap.
                </p>
              </div>

              <div className="text-xs font-medium text-neutral-400">
                {formatNumber(
                  analytics.comments.length
                )}{" "}
                comentarios
              </div>
            </div>

            {analytics.recentComments.length ===
            0 ? (
              <div className="mt-6 rounded-2xl bg-neutral-50 px-5 py-7 text-center">
                <p className="text-sm font-medium text-neutral-700">
                  Todavía no hay comentarios
                </p>

                <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                  Cuando tus clientes dejen un
                  comentario, aparecerá acá.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                    Comentarios recientes
                  </p>

                  <div className="mt-3 space-y-3">
                    {analytics.recentComments.map(
                      (item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-neutral-100 bg-neutral-50/70 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-1 text-xs font-medium">
                              {Array.from(
                                { length: 5 },
                                (_, index) => (
                                  <span
                                    key={index}
                                    className={
                                      index <
                                      item.rating
                                        ? "text-black"
                                        : "text-neutral-300"
                                    }
                                  >
                                    ★
                                  </span>
                                )
                              )}
                            </div>

                            <span className="shrink-0 text-[10px] text-neutral-400">
                              {formatFeedbackDate(
                                item.created_at
                              )}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-neutral-700">
                            “{item.message}”
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                    Valoraciones críticas con comentario
                  </p>

                  {analytics.criticalComments
                    .length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-neutral-100 bg-neutral-50/70 p-5">
                      <p className="text-sm font-medium text-neutral-700">
                        No hay comentarios críticos
                      </p>

                      <p className="mt-1.5 text-xs leading-5 text-neutral-500">
                        Por ahora no hay comentarios
                        asociados a valoraciones de
                        1 o 2 estrellas.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {analytics.criticalComments.map(
                        (item) => (
                          <div
                            key={item.id}
                            className="rounded-2xl border border-neutral-200 bg-white p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1 text-xs">
                                {Array.from(
                                  { length: 5 },
                                  (_, index) => (
                                    <span
                                      key={index}
                                      className={
                                        index <
                                        item.rating
                                          ? "text-black"
                                          : "text-neutral-300"
                                      }
                                    >
                                      ★
                                    </span>
                                  )
                                )}
                              </div>

                              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-neutral-500">
                                1–2 ESTRELLAS
                              </span>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-neutral-700">
                              “{item.message}”
                            </p>

                            <p className="mt-2 text-[10px] text-neutral-400">
                              {formatFeedbackDate(
                                item.created_at
                              )}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}