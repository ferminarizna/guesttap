"use client";

import { useEffect, useState } from "react";
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

function Icon({
  name,
  size = 20,
}: {
  name:
    | "home"
    | "star"
    | "qr"
    | "settings"
    | "external"
    | "arrow"
    | "message"
    | "thumb"
    | "check"
    | "activity";
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

    case "star":
      return (
        <svg {...common}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
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
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.5V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.5h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.5v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.5H21a1.7 1.7 0 0 0-1.6 1Z" />
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

    case "message":
      return (
        <svg {...common}>
          <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.2-3.6A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5c4.1 0 7.5 3.1 8 7Z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
      );

    case "thumb":
      return (
        <svg {...common}>
          <path d="M7 10v10" />
          <path d="M3 10h4v10H3z" />
          <path d="M7 10l4-7c.4-.7 1.5-.4 1.5.4V7h5.2a2 2 0 0 1 2 2.3l-1 7a2 2 0 0 1-2 1.7H7" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-7 4 14 2-7h6" />
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
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= rating
              ? "text-neutral-950"
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

export default function PanelPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarPanel();
  }, []);

  async function cargarPanel() {
    setLoading(true);
    setError("");

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
        .select("id, name, slug, logo_url")
        .eq("id", businessUser.business_id)
        .single();

    if (businessError || !businessData) {
      console.error(businessError);
      setError("No pudimos cargar tu negocio.");
      setLoading(false);
      return;
    }

    setBusiness(businessData);

    const { data: feedbackData, error: feedbackError } =
      await supabase
        .from("feedback")
        .select("id, rating, message, created_at")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error(feedbackError);
      setError("No pudimos cargar las valoraciones.");
      setLoading(false);
      return;
    }

    setFeedback(feedbackData || []);
    setLoading(false);
  }

  const promedio =
    feedback.length > 0
      ? (
          feedback.reduce(
            (total, item) => total + item.rating,
            0
          ) / feedback.length
        ).toFixed(1)
      : "0.0";

  const positivas =
    feedback.length > 0
      ? Math.round(
          (feedback.filter((item) => item.rating >= 4).length /
            feedback.length) *
            100
        )
      : 0;

  const feedbackPrivado = feedback.filter(
    (item) => item.message && item.message.trim() !== ""
  ).length;

  const publicUrl = business
    ? `${PRODUCTION_URL}/${business.slug}`
    : "";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] p-3 sm:p-5">
        <div className="mx-auto max-w-[1440px]">
          <div className="min-h-[calc(100vh-24px)] overflow-hidden rounded-[28px] border border-neutral-200 bg-white sm:min-h-[calc(100vh-40px)]">
            <div className="animate-pulse p-5 sm:p-8">
              <div className="h-10 w-48 rounded-xl bg-neutral-200" />
              <div className="mt-3 h-4 w-72 rounded bg-neutral-100" />

              <div className="mt-8 h-52 rounded-3xl bg-neutral-100" />

              <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-28 rounded-2xl bg-neutral-100"
                  />
                ))}
              </div>

              <div className="mt-5 h-80 rounded-2xl bg-neutral-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-5">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold text-neutral-950">
            No pudimos cargar el panel
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!business) {
    return null;
  }

  const navigation = [
    {
      href: "/panel",
      label: "Resumen",
      icon: "home" as const,
      active: true,
    },
    {
      href: "/panel/feedback",
      label: "Feedback",
      icon: "message" as const,
      active: false,
    },
    {
      href: "/panel/qr",
      label: "Mi QR",
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

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-neutral-950">
      <div className="mx-auto max-w-[1440px] p-0 sm:p-4 lg:p-5">
        <div className="flex min-h-screen overflow-hidden bg-white sm:min-h-[calc(100vh-32px)] sm:rounded-[30px] sm:border sm:border-neutral-200 sm:shadow-[0_12px_50px_rgba(0,0,0,0.045)]">

          {/* SIDEBAR DESKTOP */}

          <aside className="hidden w-[235px] shrink-0 border-r border-neutral-200 bg-[#fafaf9] md:flex md:flex-col">

            <div className="px-6 py-7">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                  G
                </div>

                <div>
                  <p className="text-sm font-bold tracking-tight">
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
                {navigation.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                      item.active
                        ? "bg-black font-semibold text-white"
                        : "font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950"
                    }`}
                  >
                    <Icon name={item.icon} size={17} />
                    {item.label}
                  </a>
                ))}
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
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">
                      {business.name}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
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
                className="flex items-center justify-between rounded-xl bg-black px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-neutral-800"
              >
                <span>Ver página pública</span>
                <Icon name="external" size={15} />
              </a>
            </div>
          </aside>

          {/* CONTENIDO */}

          <div className="min-w-0 flex-1">

            {/* HEADER */}

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
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-base font-bold text-white sm:h-11 sm:w-11 sm:text-lg">
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[9px]">
                      Tu negocio
                    </p>

                    <h1 className="truncate text-base font-semibold tracking-tight sm:text-xl">
                      {business.name}
                    </h1>
                  </div>

                </div>

                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[11px] font-semibold text-neutral-900 transition hover:bg-neutral-50 sm:px-4 sm:text-xs"
                >
                  <span className="hidden xs:inline">
                    Ver página
                  </span>

                  <span className="sm:hidden">
                    Página
                  </span>

                  <Icon name="external" size={13} />
                </a>

              </div>

              {/* NAVEGACIÓN MOBILE */}

              <nav className="-mx-1 mt-4 flex gap-1 overflow-x-auto px-1 pb-0.5 md:hidden">
                {navigation.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] ${
                      item.active
                        ? "bg-black font-semibold text-white"
                        : "font-medium text-neutral-500 hover:bg-neutral-100"
                    }`}
                  >
                    <Icon name={item.icon} size={14} />
                    {item.label}
                  </a>
                ))}
              </nav>

            </header>

            {/* MAIN */}

            <div className="px-4 py-6 sm:px-7 sm:py-9 lg:px-9">

              <div className="mx-auto max-w-[1180px]">

                {/* INTRO */}

                <section>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

                    <div>
                      <p className="text-[11px] font-medium text-neutral-400 sm:text-xs">
                        Resumen
                      </p>

                      <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] sm:text-4xl">
                        Tu reputación
                      </h2>

                      <p className="mt-1.5 max-w-xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                        Una vista general de la experiencia que están teniendo tus clientes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Todo funcionando
                    </div>

                  </div>
                </section>

                {/* REPUTACIÓN */}

                <section className="mt-6 overflow-hidden rounded-[22px] bg-[#111111] text-white sm:mt-8 sm:rounded-[26px]">

                  <div className="p-5 sm:p-7 lg:p-8">

                    <div className="grid gap-7 md:grid-cols-[1.15fr_0.85fr] md:gap-0">

                      {/* RATING */}

                      <div className="md:border-r md:border-white/10 md:pr-8">

                        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/35 sm:text-[10px]">
                          Reputación actual
                        </p>

                        <div className="mt-5 flex items-end gap-4 sm:mt-7 sm:gap-6">

                          <div>
                            <p className="text-[56px] font-semibold leading-none tracking-[-0.07em] sm:text-7xl">
                              {promedio}
                            </p>

                            <p className="mt-1.5 text-[10px] text-white/40 sm:text-xs">
                              promedio sobre 5
                            </p>
                          </div>

                          <div className="pb-1">

                            <div className="text-lg tracking-[2px] sm:text-xl sm:tracking-[3px]">
                              <span className="text-white">
                                {"★".repeat(
                                  Math.min(
                                    5,
                                    Math.max(
                                      0,
                                      Math.round(Number(promedio))
                                    )
                                  )
                                )}
                              </span>

                              <span className="text-white/15">
                                {"★".repeat(
                                  5 -
                                    Math.min(
                                      5,
                                      Math.max(
                                        0,
                                        Math.round(Number(promedio))
                                      )
                                    )
                                )}
                              </span>
                            </div>

                            <p className="mt-1 text-[10px] text-white/40 sm:text-xs">
                              {feedback.length}{" "}
                              {feedback.length === 1
                                ? "valoración"
                                : "valoraciones"}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* RESUMEN */}

                      <div className="grid grid-cols-2 gap-0 md:pl-8">

                        <div className="border-r border-white/10 pr-4 sm:pr-8">
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 sm:text-[10px]">
                            Positivas
                          </p>

                          <p className="mt-4 text-3xl font-semibold tracking-tight sm:mt-5 sm:text-4xl">
                            {positivas}%
                          </p>

                          <p className="mt-1.5 text-[10px] text-white/40 sm:text-xs">
                            4 y 5 estrellas
                          </p>
                        </div>

                        <div className="pl-4 sm:pl-8">
                          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 sm:text-[10px]">
                            Feedback
                          </p>

                          <p className="mt-4 text-3xl font-semibold tracking-tight sm:mt-5 sm:text-4xl">
                            {feedbackPrivado}
                          </p>

                          <p className="mt-1.5 text-[10px] text-white/40 sm:text-xs">
                            comentarios privados
                          </p>
                        </div>

                      </div>

                    </div>

                  </div>

                </section>

                {/* METRICAS */}

                <section className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">

                    <div className="flex items-center justify-between">

                      <p className="text-[10px] font-medium text-neutral-500 sm:text-xs">
                        Valoraciones
                      </p>

                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 sm:h-8 sm:w-8">
                        <Icon name="activity" size={14} />
                      </div>

                    </div>

                    <p className="mt-3 text-2xl font-semibold tracking-tight sm:mt-4 sm:text-3xl">
                      {feedback.length}
                    </p>

                    <p className="mt-1 text-[10px] text-neutral-400 sm:text-xs">
                      recibidas
                    </p>

                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">

                    <div className="flex items-center justify-between">

                      <p className="text-[10px] font-medium text-neutral-500 sm:text-xs">
                        Feedback privado
                      </p>

                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 sm:h-8 sm:w-8">
                        <Icon name="message" size={14} />
                      </div>

                    </div>

                    <p className="mt-3 text-2xl font-semibold tracking-tight sm:mt-4 sm:text-3xl">
                      {feedbackPrivado}
                    </p>

                    <p className="mt-1 text-[10px] text-neutral-400 sm:text-xs">
                      comentarios
                    </p>

                  </div>

                  <div className="col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 sm:col-span-1 sm:p-5">

                    <div className="flex items-center justify-between">

                      <p className="text-[10px] font-medium text-neutral-500 sm:text-xs">
                        Estado
                      </p>

                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 sm:h-8 sm:w-8">
                        <Icon name="check" size={14} />
                      </div>

                    </div>

                    <div className="mt-3 flex items-baseline gap-2 sm:mt-4">

                      <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        Activo
                      </p>

                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                    </div>

                    <p className="mt-1 text-[10px] text-neutral-400 sm:text-xs">
                      Tu GuestTap funciona correctamente
                    </p>

                  </div>

                </section>

                {/* ACTIVIDAD */}

                <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px] lg:gap-5">

                  {/* OPINIONES */}

                  <div className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white">

                    <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4.5 sm:px-6 sm:py-5">

                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-neutral-400 sm:text-[10px]">
                          Actividad
                        </p>

                        <h3 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
                          Últimas opiniones
                        </h3>
                      </div>

                      <a
                        href="/panel/feedback"
                        className="flex items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 sm:px-3 sm:text-xs"
                      >
                        <span className="hidden sm:inline">
                          Ver todas
                        </span>

                        <span className="sm:hidden">
                          Todas
                        </span>

                        <Icon name="arrow" size={13} />
                      </a>

                    </div>

                    {feedback.length === 0 ? (
                      <div className="px-5 py-14 text-center sm:px-6 sm:py-16">

                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100">
                          <Icon name="message" size={18} />
                        </div>

                        <p className="mt-4 text-sm font-semibold">
                          Todavía no hay opiniones
                        </p>

                        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-neutral-500">
                          Las opiniones de tus clientes aparecerán acá.
                        </p>

                      </div>
                    ) : (
                      <div>

                        {feedback.slice(0, 8).map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-3 border-b border-neutral-100 px-5 py-4 last:border-b-0 sm:gap-4 sm:px-6 sm:py-5"
                          >

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[10px] font-semibold sm:h-10 sm:w-10 sm:text-xs">
                              {item.rating}/5
                            </div>

                            <div className="min-w-0 flex-1">

                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">

                                <RatingStars rating={item.rating} />

                                <span className="text-[9px] text-neutral-400 sm:text-[11px]">
                                  {formatDate(item.created_at)}
                                </span>

                              </div>

                              <p className="mt-1.5 truncate text-xs font-medium text-neutral-800 sm:text-sm">
                                {item.message || "Sin comentario"}
                              </p>

                            </div>

                          </div>
                        ))}

                      </div>
                    )}

                    {feedback.length > 0 && (
                      <div className="border-t border-neutral-200 p-3 sm:hidden">
                        <a
                          href="/panel/feedback"
                          className="block rounded-xl bg-neutral-100 px-4 py-3 text-center text-xs font-semibold"
                        >
                          Ver todas las opiniones
                        </a>
                      </div>
                    )}

                  </div>

                  {/* LATERAL */}

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">

                    {/* ESTADO */}

                    <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">

                      <div className="flex items-start justify-between">

                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-neutral-400 sm:text-[10px]">
                            Tu GuestTap
                          </p>

                          <h3 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
                            Todo funcionando
                          </h3>
                        </div>

                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100">
                          <Icon name="check" size={15} />
                        </div>

                      </div>

                      <div className="mt-5 space-y-3">

                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                          <span className="text-[11px] text-neutral-500">
                            Página pública
                          </span>

                          <span className="flex items-center gap-1.5 text-[11px] font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Activa
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                          <span className="text-[11px] text-neutral-500">
                            QR
                          </span>

                          <span className="flex items-center gap-1.5 text-[11px] font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Activo
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-neutral-500">
                            Feedback
                          </span>

                          <span className="flex items-center gap-1.5 text-[11px] font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Activo
                          </span>
                        </div>

                      </div>

                    </div>

                    {/* ACCIONES */}

                    <div className="rounded-[22px] bg-[#111111] p-5 text-white sm:p-6">

                      <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-white/35 sm:text-[10px]">
                        Acciones rápidas
                      </p>

                      <h3 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
                        Gestioná tu cuenta
                      </h3>

                      <div className="mt-4 grid gap-2 sm:mt-5 lg:grid-cols-1">

                        <a
                          href="/panel/qr"
                          className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs font-medium transition hover:bg-white/15"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon name="qr" size={15} />
                            Mi QR
                          </span>

                          <Icon name="arrow" size={14} />
                        </a>

                        <a
                          href="/panel/feedback"
                          className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs font-medium transition hover:bg-white/15"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon name="message" size={15} />
                            Feedback
                          </span>

                          <Icon name="arrow" size={14} />
                        </a>

                        <a
                          href="/panel/configuracion"
                          className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-xs font-medium transition hover:bg-white/15"
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon name="settings" size={15} />
                            Configuración
                          </span>

                          <Icon name="arrow" size={14} />
                        </a>

                      </div>

                    </div>

                  </div>

                </section>

                {/* PÁGINA PÚBLICA */}

                <section className="mt-4 sm:mt-5">

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-[20px] border border-neutral-200 bg-white px-4 py-4 transition hover:border-neutral-300 hover:shadow-sm sm:px-6 sm:py-5"
                  >

                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 sm:h-10 sm:w-10">
                        <Icon name="external" size={16} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-semibold sm:text-sm">
                          Página pública
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-neutral-500 sm:text-xs">
                          Así ven tus clientes tu GuestTap.
                        </p>
                      </div>

                    </div>

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-neutral-200 transition group-hover:bg-neutral-100 sm:h-9 sm:w-9">
                      <Icon name="arrow" size={14} />
                    </div>

                  </a>

                </section>

                <footer className="py-7 text-center sm:py-8">
                  <p className="text-[9px] text-neutral-400 sm:text-[10px]">
                    GuestTap · Panel de gestión
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