"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const PRODUCTION_URL = "https://guesttap-five.vercel.app";

type Business = {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
};

type Feedback = {
  id: number;
  rating: number;
  message: string | null;
  created_at: string;
};

type Intelligence = {
  totalAnalyses: number;
  primaryInsight: {
    type:
      | "attention"
      | "strength"
      | "emerging"
      | "observation";
    title: string;
    description: string;
    metric: string;
    supporting: string;
    confidence: number;
  } | null;
};

function Icon({
  name,
  size = 20,
}: {
  name:
    | "home"
    | "message"
    | "qr"
    | "settings"
    | "external"
    | "arrow"
    | "star"
    | "scan"
    | "insight"
    | "check"
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

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="m3 10 9-7 9 7" />
          <path d="M5 9v11h14V9" />
          <path d="M9 20v-6h6v6" />
        </svg>
      );

    case "message":
      return (
        <svg {...common}>
          <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.2-3.6A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5c4.1 0 7.5 3.1 8 7Z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      );

    case "qr":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <path d="M14 14h3v3h-3z" />
          <path d="M20 14v6h-6" />
          <path d="M17 20v-3" />
        </svg>
      );

    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.5V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.5h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 .3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.5H21a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );

    case "external":
      return (
        <svg {...common}>
          <path d="M14 3h7v7" />
          <path d="M10 14 21 3" />
          <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
        </svg>
      );

    case "star":
      return (
        <svg {...common}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      );

    case "scan":
      return (
        <svg {...common}>
          <path d="M7 3H5a2 2 0 0 0-2 2v2" />
          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <path d="M7 7h10v10H7z" />
        </svg>
      );

    case "insight":
      return (
        <svg {...common}>
          <path d="M12 3v3" />
          <path d="M12 18v3" />
          <path d="m4.9 4.9 2.1 2.1" />
          <path d="m17 17 2.1 2.1" />
          <path d="M3 12h3" />
          <path d="M18 12h3" />
          <path d="m4.9 19.1 2.1-2.1" />
          <path d="m17 7 2.1-2.1" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "trend":
      return (
        <svg {...common}>
          <path d="M3 17 9 11l4 4 8-9" />
          <path d="M16 6h5v5" />
        </svg>
      );

    default:
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
  }
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= rating
              ? "text-[#E3A72F]"
              : "text-neutral-200"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

export default function PanelPage() {
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [feedback, setFeedback] =
    useState<Feedback[]>([]);

  const [scanCount, setScanCount] = useState(0);

  const [intelligence, setIntelligence] =
    useState<Intelligence | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPanel();
  }, []);

  async function cargarPanel() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No hay una sesión iniciada.");
        return;
      }

      const {
        data: businessUser,
        error: businessUserError,
      } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", user.id)
        .single();

      if (businessUserError || !businessUser) {
        console.error(businessUserError);
        setError(
          "No encontramos un negocio asociado a tu cuenta."
        );
        return;
      }

      const {
        data: businessData,
        error: businessError,
      } = await supabase
        .from("businesses")
        .select("id, name, slug, logo_url")
        .eq("id", businessUser.business_id)
        .single();

      if (businessError || !businessData) {
        console.error(businessError);
        setError("No pudimos cargar tu negocio.");
        return;
      }

      setBusiness(businessData);

      const [
        feedbackResult,
        scansResult,
        intelligenceResult,
      ] = await Promise.all([
        supabase
          .from("feedback")
          .select(
            "id, rating, message, created_at"
          )
          .eq(
            "business_id",
            businessData.id
          )
          .order("created_at", {
            ascending: false,
          }),

        supabase
          .from("scan_events")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq(
            "business_id",
            businessData.id
          ),

        fetch(
          `/api/analytics/intelligence?businessId=${businessData.id}`,
          {
            cache: "no-store",
          }
        ),
      ]);

      if (feedbackResult.error) {
        console.error(
          feedbackResult.error
        );
        setError(
          "No pudimos cargar las valoraciones."
        );
        return;
      }

      if (scansResult.error) {
        console.error(
          scansResult.error
        );
        setError(
          "No pudimos cargar los escaneos."
        );
        return;
      }

      setFeedback(
        feedbackResult.data || []
      );

      setScanCount(
        scansResult.count || 0
      );

      if (intelligenceResult.ok) {
        const intelligenceData =
          await intelligenceResult.json();

        if (intelligenceData.ok) {
          setIntelligence(
            intelligenceData
          );
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        "Ocurrió un error al cargar el panel."
      );
    } finally {
      setLoading(false);
    }
  }

  const averageRating = useMemo(() => {
    if (feedback.length === 0) {
      return "0.0";
    }

    return (
      feedback.reduce(
        (total, item) =>
          total + item.rating,
        0
      ) / feedback.length
    ).toFixed(1);
  }, [feedback]);

  const positivePercentage = useMemo(() => {
    if (feedback.length === 0) {
      return 0;
    }

    return Math.round(
      (feedback.filter(
        (item) => item.rating >= 4
      ).length /
        feedback.length) *
        100
    );
  }, [feedback]);

  const attentionPercentage = useMemo(() => {
    if (feedback.length === 0) {
      return 0;
    }

    return Math.round(
      (feedback.filter(
        (item) => item.rating <= 2
      ).length /
        feedback.length) *
        100
    );
  }, [feedback]);

  const privateFeedback = useMemo(() => {
    return feedback.filter(
      (item) =>
        item.message &&
        item.message.trim() !== ""
    ).length;
  }, [feedback]);

  const conversion = useMemo(() => {
    if (scanCount === 0) {
      return 0;
    }

    return Math.round(
      (feedback.length / scanCount) * 100
    );
  }, [feedback.length, scanCount]);

  const publicUrl = business
    ? `${PRODUCTION_URL}/${business.slug}`
    : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F6F6F4] p-3 sm:p-5">
        <div className="mx-auto max-w-[1440px]">
          <div className="min-h-[calc(100vh-24px)] overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5 sm:min-h-[calc(100vh-40px)] sm:p-8">
            <div className="animate-pulse">
              <div className="h-10 w-48 rounded-xl bg-neutral-200" />
              <div className="mt-3 h-4 w-72 rounded bg-neutral-100" />
              <div className="mt-8 h-56 rounded-[26px] bg-neutral-100" />
              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-32 rounded-2xl bg-neutral-100"
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F6F6F4] px-5">
        <div className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173F53] text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold">
            No pudimos cargar el panel
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error ||
              "No encontramos información del negocio."}
          </p>
        </div>
      </main>
    );
  }

  const navigation = [
    {
      href: "/panel",
      label: "Inicio",
      icon: "home" as const,
      active: true,
    },
    {
      href: "/panel/analytics",
      label: "Analytics",
      icon: "trend" as const,
      active: false,
    },
    {
      href: "/panel/feedback",
      label: "Feedback",
      icon: "message" as const,
      active: false,
    },
    {
      href: "/panel/qr",
      label: "QR / NFC",
      icon: "qr" as const,
      active: false,
    },
    {
      href: "/panel/configuracion",
      label: "Configuración",
      icon: "settings" as const,
      active: false,
    },
  ];

  const insight =
    intelligence?.primaryInsight;

  return (
    <main className="min-h-screen bg-[#F6F6F4] text-[#183B4E]">
      <div className="mx-auto max-w-[1440px] p-0 sm:p-4 lg:p-5">
        <div className="flex min-h-screen overflow-hidden bg-white sm:min-h-[calc(100vh-32px)] sm:rounded-[30px] sm:border sm:border-neutral-200 sm:shadow-[0_12px_50px_rgba(0,0,0,0.045)]">

          {/* SIDEBAR */}

          <aside className="hidden w-[245px] shrink-0 border-r border-neutral-200 bg-[#FAFAF9] md:flex md:flex-col">
            <div className="px-6 py-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173F53] text-sm font-bold text-white">
                  G
                </div>

                <div>
                  <p className="text-sm font-bold tracking-tight text-[#183B4E]">
                    GuestTap
                  </p>

                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                    Business
                  </p>
                </div>
              </div>
            </div>

            <div className="px-3">
              <p className="px-3 pb-2 text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Gestión
              </p>

              <nav className="space-y-1">
                {navigation.map(
                  (item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                        item.active
                          ? "bg-[#173F53] font-semibold text-white"
                          : "font-medium text-neutral-500 hover:bg-neutral-100 hover:text-[#183B4E]"
                      }`}
                    >
                      <Icon
                        name={item.icon}
                        size={17}
                      />
                      {item.label}
                    </a>
                  )
                )}
              </nav>
            </div>

            <div className="mt-auto p-4">
              <div className="mb-3 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="h-9 w-9 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-sm font-bold">
                      {business.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {business.name}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#25B7A4]" />
                      <span className="text-[10px] text-neutral-400">
                        Cuenta activa
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl bg-[#173F53] px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-[#214F65]"
              >
                Ver página pública
                <Icon
                  name="external"
                  size={15}
                />
              </a>
            </div>
          </aside>

          {/* CONTENIDO */}

          <div className="min-w-0 flex-1">
            <header className="border-b border-neutral-200 px-4 py-4 sm:px-7 sm:py-5 lg:px-9">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-black/10 sm:h-11 sm:w-11"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173F53] text-base font-bold text-white sm:h-11 sm:w-11">
                      {business.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[9px]">
                      Tu negocio
                    </p>

                    <h1 className="truncate text-base font-semibold tracking-tight text-[#183B4E] sm:text-xl">
                      {business.name}
                    </h1>
                  </div>
                </div>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-[#183B4E] transition hover:bg-neutral-50 sm:px-4 sm:text-xs"
                >
                  <span className="hidden sm:inline">
                    Ver página
                  </span>

                  <span className="sm:hidden">
                    Página
                  </span>

                  <Icon
                    name="external"
                    size={13}
                  />
                </a>
              </div>

              <nav className="-mx-1 mt-4 flex gap-1 overflow-x-auto px-1 md:hidden">
                {navigation.map(
                  (item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] ${
                        item.active
                          ? "bg-[#173F53] font-semibold text-white"
                          : "font-medium text-neutral-500 hover:bg-neutral-100"
                      }`}
                    >
                      <Icon
                        name={item.icon}
                        size={14}
                      />
                      {item.label}
                    </a>
                  )
                )}
              </nav>
            </header>

            <div className="px-4 py-6 sm:px-7 sm:py-9 lg:px-9">
              <div className="mx-auto max-w-[1180px]">

                {/* HERO */}

                <section>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E8086]">
                    Inicio
                  </p>

                  <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h2 className="text-[31px] font-semibold tracking-[-0.045em] text-[#183B4E] sm:text-[42px]">
                        Tu experiencia,
                        <br className="hidden sm:block" />
                        {" "}en una sola vista.
                      </h2>

                      <p className="mt-3 max-w-[650px] text-sm leading-6 text-[#718087] sm:text-[15px]">
                        GuestTap reúne lo que tus clientes
                        están diciendo, cómo evoluciona la
                        experiencia y qué merece tu atención.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-full border border-[#DCE6E1] bg-[#F4F8F5] px-3.5 py-2 text-[10px] font-semibold text-[#47707E]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#25B7A4]" />
                      GuestTap activo
                    </div>
                  </div>
                </section>

                {/* REPUTACIÓN */}

                <section className="mt-7 overflow-hidden rounded-[26px] bg-[#173F53] text-white">
                  <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="p-6 sm:p-8 lg:border-r lg:border-white/10">
                      <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-white/45">
                        Reputación actual
                      </p>

                      <div className="mt-5 flex items-end gap-5">
                        <div>
                          <p className="text-[58px] font-semibold leading-none tracking-[-0.07em] sm:text-[72px]">
                            {averageRating}
                          </p>

                          <p className="mt-2 text-[10px] text-white/45 sm:text-xs">
                            promedio sobre 5
                          </p>
                        </div>

                        <div className="pb-1">
                          <RatingStars
                            rating={Math.round(
                              Number(
                                averageRating
                              )
                            )}
                          />

                          <p className="mt-2 text-[10px] text-white/45 sm:text-xs">
                            {formatNumber(
                              feedback.length
                            )}{" "}
                            {feedback.length === 1
                              ? "valoración"
                              : "valoraciones"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-white/10 lg:border-t-0">
                      <div className="border-r border-white/10 p-6 sm:p-8">
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                          Positivas
                        </p>

                        <p className="mt-4 text-3xl font-semibold sm:text-4xl">
                          {positivePercentage}%
                        </p>

                        <p className="mt-1.5 text-[10px] text-white/40 sm:text-xs">
                          4 y 5 estrellas
                        </p>
                      </div>

                      <div className="p-6 sm:p-8">
                        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                          Atención
                        </p>

                        <p className="mt-4 text-3xl font-semibold sm:text-4xl">
                          {attentionPercentage}%
                        </p>

                        <p className="mt-1.5 text-[10px] text-white/40 sm:text-xs">
                          1 y 2 estrellas
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* MÉTRICAS */}

                <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    {
                      label: "Escaneos",
                      value: scanCount,
                      description:
                        "interacciones registradas",
                      icon: "scan" as const,
                    },
                    {
                      label: "Valoraciones",
                      value: feedback.length,
                      description:
                        "respuestas recibidas",
                      icon: "star" as const,
                    },
                    {
                      label: "Feedback",
                      value: privateFeedback,
                      description:
                        "comentarios escritos",
                      icon: "message" as const,
                    },
                    {
                      label: "Conversión",
                      value: `${conversion}%`,
                      description:
                        "scan → valoración",
                      icon: "trend" as const,
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-[21px] border border-neutral-200 bg-white p-4 sm:p-5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7C8A90]">
                          {metric.label}
                        </p>

                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F2F5F3] text-[#53656C]">
                          <Icon
                            name={metric.icon}
                            size={15}
                          />
                        </div>
                      </div>

                      <p className="mt-4 text-2xl font-semibold tracking-tight text-[#183B4E] sm:text-3xl">
                        {typeof metric.value ===
                        "number"
                          ? formatNumber(
                              metric.value
                            )
                          : metric.value}
                      </p>

                      <p className="mt-1 text-[10px] leading-4 text-[#8A969B] sm:text-xs">
                        {metric.description}
                      </p>
                    </div>
                  ))}
                </section>

                {/* INTELLIGENCE */}

                <section className="mt-5 overflow-hidden rounded-[26px] border border-[#CFE2DE] bg-[#F1F9F7]">
                  <div className="border-b border-[#D5E7E3] p-6 sm:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173F53] text-white">
                          <Icon
                            name="insight"
                            size={20}
                          />
                        </div>

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#47707E]">
                            GuestTap Intelligence
                          </p>

                          <h3 className="mt-1 text-[20px] font-bold tracking-tight text-[#173F53]">
                            Lo que merece tu atención.
                          </h3>
                        </div>
                      </div>

                      <a
                        href="/panel/analytics"
                        className="inline-flex items-center gap-1.5 self-start rounded-xl border border-[#CFE2DE] bg-white px-3.5 py-2.5 text-[10px] font-semibold text-[#173F53] transition hover:bg-[#F8FBF9]"
                      >
                        Ver análisis completo
                        <Icon
                          name="arrow"
                          size={13}
                        />
                      </a>
                    </div>

                    <p className="mt-4 max-w-[720px] text-xs leading-5 text-[#607781] sm:text-sm">
                      GuestTap agrupa señales provenientes de
                      comentarios reales. Una observación aislada
                      no se convierte automáticamente en un problema.
                    </p>
                  </div>

                  <div className="p-5 sm:p-7">
                    {insight ? (
                      <div className="rounded-[22px] border border-[#D8E5E1] bg-white p-5 sm:p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              insight.type ===
                              "attention"
                                ? "bg-[#FBE8E3] text-[#C75E4B]"
                                : insight.type ===
                                    "strength"
                                  ? "bg-[#E3F5F0] text-[#168F7F]"
                                  : "bg-[#E8F0F4] text-[#183B4E]"
                            }`}
                          >
                            <Icon
                              name={
                                insight.type ===
                                "attention"
                                  ? "trend"
                                  : "insight"
                              }
                              size={18}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#7C8A90]">
                                Señal detectada
                              </p>

                              <span className="rounded-full bg-[#F3F6F4] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#718087]">
                                {insight.type ===
                                "attention"
                                  ? "Atención"
                                  : insight.type ===
                                      "strength"
                                    ? "Fortaleza"
                                    : "Emergente"}
                              </span>
                            </div>

                            <h4 className="mt-2 text-lg font-bold tracking-tight text-[#173F53] sm:text-xl">
                              {insight.title}
                            </h4>

                            <p className="mt-2 max-w-[760px] text-xs leading-5 text-[#687A82] sm:text-sm">
                              {insight.description}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-full bg-[#F5F8F6] px-3 py-1.5 text-[9px] font-semibold text-[#53656C]">
                                {insight.metric}
                              </span>

                              <span className="rounded-full bg-[#F5F8F6] px-3 py-1.5 text-[9px] font-semibold text-[#53656C]">
                                {insight.supporting}
                              </span>

                              <span className="rounded-full bg-[#E3F5F0] px-3 py-1.5 text-[9px] font-semibold text-[#168F7F]">
                                Confianza{" "}
                                {Math.round(
                                  insight.confidence *
                                    100
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-[#CFE2DE] bg-white px-5 py-10 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF4F1] text-[#47707E]">
                          <Icon
                            name="insight"
                            size={18}
                          />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-[#173F53]">
                          Todavía no hay suficiente evidencia.
                        </p>

                        <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#718087]">
                          A medida que lleguen comentarios,
                          GuestTap podrá identificar patrones
                          y señales relevantes.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* ÚLTIMA ACTIVIDAD + ACCIONES */}

                <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">

                  <div className="overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
                    <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-5 sm:px-6">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#7C8A90]">
                          Actividad reciente
                        </p>

                        <h3 className="mt-1 text-lg font-bold tracking-tight text-[#183B4E]">
                          Últimas opiniones
                        </h3>
                      </div>

                      <a
                        href="/panel/feedback"
                        className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold text-[#53656C] transition hover:bg-neutral-100"
                      >
                        Ver todas
                        <Icon
                          name="arrow"
                          size={13}
                        />
                      </a>
                    </div>

                    {feedback.length === 0 ? (
                      <div className="px-5 py-14 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
                          <Icon
                            name="message"
                            size={18}
                          />
                        </div>

                        <p className="mt-4 text-sm font-semibold text-[#183B4E]">
                          Todavía no hay opiniones.
                        </p>

                        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-[#718087]">
                          Cuando tus clientes empiecen a responder,
                          sus opiniones aparecerán acá.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {feedback
                          .slice(0, 6)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex gap-3 border-b border-neutral-100 px-5 py-4 last:border-b-0 sm:gap-4 sm:px-6"
                            >
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F5F4] text-[10px] font-bold text-[#53656C]">
                                {item.rating}/5
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <RatingStars
                                    rating={
                                      item.rating
                                    }
                                  />

                                  <span className="text-[9px] text-[#8A969B]">
                                    {formatDate(
                                      item.created_at
                                    )}
                                  </span>
                                </div>

                                <p className="mt-1.5 truncate text-xs font-medium text-[#183B4E] sm:text-sm">
                                  {item.message ||
                                    "Sin comentario"}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-5">

                    <div className="rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#7C8A90]">
                            Tu GuestTap
                          </p>

                          <h3 className="mt-1 text-lg font-bold tracking-tight text-[#183B4E]">
                            Todo funcionando
                          </h3>
                        </div>

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F5F1] text-[#168F7F]">
                          <Icon
                            name="check"
                            size={16}
                          />
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {[
                          "Página pública",
                          "Captura de feedback",
                          "Analytics",
                        ].map((item) => (
                          <div
                            key={item}
                            className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                          >
                            <span className="text-[11px] text-[#718087]">
                              {item}
                            </span>

                            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#168F7F]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#25B7A4]" />
                              Activo
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[24px] bg-[#173F53] p-5 text-white sm:p-6">
                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-white/45">
                        Acciones rápidas
                      </p>

                      <h3 className="mt-1 text-lg font-bold tracking-tight">
                        Gestioná tu GuestTap.
                      </h3>

                      <div className="mt-5 space-y-2">
                        <a
                          href="/panel/qr"
                          className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs font-semibold transition hover:bg-white/15"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon
                              name="qr"
                              size={15}
                            />
                            QR / NFC
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </a>

                        <a
                          href="/panel/feedback"
                          className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs font-semibold transition hover:bg-white/15"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon
                              name="message"
                              size={15}
                            />
                            Feedback
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </a>

                        <a
                          href="/panel/configuracion"
                          className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs font-semibold transition hover:bg-white/15"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon
                              name="settings"
                              size={15}
                            />
                            Configuración
                          </span>

                          <Icon
                            name="arrow"
                            size={14}
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                </section>

                {/* CTA */}

                <section className="mt-5">
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-[22px] border border-[#DCE5E1] bg-[#F7FAF8] px-5 py-5 transition hover:border-[#C7D8D2] sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#53656C] shadow-sm">
                        <Icon
                          name="external"
                          size={16}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#183B4E] sm:text-sm">
                          Ver tu página pública
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-[#718087] sm:text-xs">
                          Así interactúan tus clientes con GuestTap.
                        </p>
                      </div>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DCE5E1] bg-white text-[#53656C] transition group-hover:bg-[#F1F5F3]">
                      <Icon
                        name="arrow"
                        size={14}
                      />
                    </div>
                  </a>
                </section>

                <footer className="py-8 text-center">
                  <p className="text-[9px] text-[#9AA4A8] sm:text-[10px]">
                    GuestTap · Customer Experience Intelligence
                  </p>
                </footer>

              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}