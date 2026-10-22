"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: number;
  name: string;
  slug: string;
};

type Feedback = {
  id: number;
  rating: number;
  message: string | null;
  created_at: string;
};

type RatingFilter = "all" | "5" | "4" | "3" | "2" | "1";
type ViewFilter = "all" | "comments" | "ratings";

function Icon({
  name,
  size = 20,
}: {
  name:
    | "arrow"
    | "message"
    | "star"
    | "activity"
    | "search"
    | "filter"
    | "close";
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

  if (name === "message") {
    return (
      <svg {...common}>
        <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.5 8.5 0 0 1-4-.9L4 20l1.2-3.6A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5c4.1 0 7.5 3.1 8 7Z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01" />
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

  if (name === "activity") {
    return (
      <svg {...common}>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
    );
  }

  if (name === "filter") {
    return (
      <svg {...common}>
        <path d="M4 6h16" />
        <path d="M7 12h10" />
        <path d="M10 18h4" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg {...common}>
        <path d="m7 7 10 10" />
        <path d="m17 7-10 10" />
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
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FeedbackPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] =
    useState<RatingFilter>("all");
  const [viewFilter, setViewFilter] =
    useState<ViewFilter>("all");

  useEffect(() => {
    cargarFeedback();
  }, []);

  async function cargarFeedback() {
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
        .limit(1)
        .maybeSingle();

    if (businessUserError || !businessUser) {
      console.error(businessUserError);
      setError("No encontramos un negocio asociado a tu cuenta.");
      setLoading(false);
      return;
    }

    const { data: businessData, error: businessError } =
      await supabase
        .from("businesses")
        .select("id, name, slug")
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
      setError("No pudimos cargar el feedback.");
      setLoading(false);
      return;
    }

    setFeedback(feedbackData || []);
    setLoading(false);
  }

  const privados = useMemo(
    () =>
      feedback.filter(
        (item) =>
          item.message &&
          item.message.trim() !== ""
      ),
    [feedback]
  );

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
          (feedback.filter(
            (item) => item.rating >= 4
          ).length /
            feedback.length) *
            100
        )
      : 0;

  const atencion =
    feedback.length > 0
      ? Math.round(
          (feedback.filter(
            (item) => item.rating <= 2
          ).length /
            feedback.length) *
            100
        )
      : 0;

  const neutras =
    feedback.length > 0
      ? Math.round(
          (feedback.filter(
            (item) => item.rating === 3
          ).length /
            feedback.length) *
            100
        )
      : 0;

  const ratingCounts = useMemo(() => {
    return {
      5: feedback.filter((item) => item.rating === 5).length,
      4: feedback.filter((item) => item.rating === 4).length,
      3: feedback.filter((item) => item.rating === 3).length,
      2: feedback.filter((item) => item.rating === 2).length,
      1: feedback.filter((item) => item.rating === 1).length,
    };
  }, [feedback]);

  const filteredFeedback = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return feedback.filter((item) => {
      const hasComment =
        Boolean(item.message) &&
        item.message!.trim() !== "";

      if (
        viewFilter === "comments" &&
        !hasComment
      ) {
        return false;
      }

      if (
        viewFilter === "ratings" &&
        hasComment
      ) {
        return false;
      }

      if (
        ratingFilter !== "all" &&
        item.rating !== Number(ratingFilter)
      ) {
        return false;
      }

      if (normalizedSearch) {
        const message =
          item.message?.toLowerCase() || "";

        const date = formatDate(
          item.created_at
        ).toLowerCase();

        if (
          !message.includes(normalizedSearch) &&
          !date.includes(normalizedSearch) &&
          !String(item.rating).includes(
            normalizedSearch
          )
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    feedback,
    search,
    ratingFilter,
    viewFilter,
  ]);

  function limpiarFiltros() {
    setSearch("");
    setRatingFilter("all");
    setViewFilter("all");
  }

  const hayFiltros =
    search.trim() !== "" ||
    ratingFilter !== "all" ||
    viewFilter !== "all";

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] px-4 py-5 sm:p-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="animate-pulse">
            <div className="h-10 w-40 rounded-xl bg-neutral-200" />

            <div className="mt-7 h-28 rounded-[24px] bg-neutral-100" />

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-neutral-100"
                />
              ))}
            </div>

            <div className="mt-5 h-24 rounded-[24px] bg-neutral-100" />
            <div className="mt-5 h-96 rounded-[24px] bg-neutral-100" />
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-5">
        <div className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold text-neutral-950">
            No pudimos cargar el feedback
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error}
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

  if (!business) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-neutral-950">
      {/* HEADER */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-7 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[10px]">
                GuestTap
              </p>

              <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                Feedback
              </h1>
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

          {/* NAVEGACIÓN */}

          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-3">
            <a
              href="/panel"
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Resumen
            </a>

            <a
              href="/panel/feedback"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-black px-3 py-2.5 text-[11px] font-semibold text-white"
            >
              <Icon name="message" size={14} />
              Feedback
            </a>

            <a
              href="/panel/qr"
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Mi QR
            </a>

            <a
              href="/panel/configuracion"
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
            >
              Configuración
            </a>
          </nav>
        </div>
      </header>

      {/* CONTENIDO */}

      <div className="px-4 py-6 sm:px-7 sm:py-9 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          {/* INTRO */}

          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              {business.name}
            </p>

            <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.04em] sm:text-4xl">
              Opiniones de clientes
            </h2>

            <p className="mt-2 max-w-xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
              Revisá las opiniones que tus clientes dejan
              a través de GuestTap y encontrá rápidamente
              qué merece atención.
            </p>
          </section>

          {/* RESUMEN */}

          <section className="mt-6 overflow-hidden rounded-[24px] bg-[#111111] text-white sm:mt-8">
            <div className="grid sm:grid-cols-[1.1fr_0.9fr]">
              {/* PROMEDIO */}

              <div className="p-5 sm:p-7">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 sm:text-[10px]">
                  Experiencia
                </p>

                <div className="mt-5 flex items-end gap-4">
                  <div>
                    <p className="text-[52px] font-semibold leading-none tracking-[-0.07em] sm:text-6xl">
                      {promedio}
                    </p>

                    <p className="mt-1.5 text-[10px] text-white/40 sm:text-xs">
                      promedio sobre 5
                    </p>
                  </div>

                  <div className="pb-1">
                    <div className="text-lg tracking-[2px]">
                      <span className="text-white">
                        {"★".repeat(
                          Math.min(
                            5,
                            Math.max(
                              0,
                              Math.round(
                                Number(promedio)
                              )
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
                                Math.round(
                                  Number(promedio)
                                )
                              )
                            )
                        )}
                      </span>
                    </div>

                    <p className="mt-1 text-[10px] text-white/40">
                      {feedback.length}{" "}
                      {feedback.length === 1
                        ? "valoración"
                        : "valoraciones"}
                    </p>
                  </div>
                </div>
              </div>

              {/* DATOS */}

              <div className="grid grid-cols-3 border-t border-white/10 sm:border-l sm:border-t-0">
                <div className="border-r border-white/10 p-4 sm:p-6">
                  <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/30 sm:text-[10px]">
                    Positivas
                  </p>

                  <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {positivas}%
                  </p>

                  <p className="mt-1 text-[9px] text-white/40 sm:text-xs">
                    4 y 5 estrellas
                  </p>
                </div>

                <div className="border-r border-white/10 p-4 sm:p-6">
                  <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/30 sm:text-[10px]">
                    Atención
                  </p>

                  <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {atencion}%
                  </p>

                  <p className="mt-1 text-[9px] text-white/40 sm:text-xs">
                    1 y 2 estrellas
                  </p>
                </div>

                <div className="p-4 sm:p-6">
                  <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-white/30 sm:text-[10px]">
                    Comentarios
                  </p>

                  <p className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {privados.length}
                  </p>

                  <p className="mt-1 text-[9px] text-white/40 sm:text-xs">
                    respuestas escritas
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* DISTRIBUCIÓN */}

          <section className="mt-5 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Distribución
                </p>

                <h3 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
                  ¿Cómo se están repartiendo las valoraciones?
                </h3>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <Icon name="star" size={16} />
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  ratingCounts[
                    rating as keyof typeof ratingCounts
                  ];

                const percentage =
                  feedback.length > 0
                    ? Math.round(
                        (count / feedback.length) * 100
                      )
                    : 0;

                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      setRatingFilter(
                        String(rating) as RatingFilter
                      )
                    }
                    className="group flex w-full items-center gap-3 text-left"
                  >
                    <span className="w-12 shrink-0 text-[11px] font-medium text-neutral-600">
                      {rating} estrellas
                    </span>

                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900 transition-all"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <span className="w-8 shrink-0 text-right text-[10px] text-neutral-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-5 sm:grid-cols-3">
              <div className="rounded-xl bg-[#f7f7f5] p-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Positivas
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {positivas}%
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f7f5] p-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Neutras
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {neutras}%
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f7f5] p-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                  Atención
                </p>

                <p className="mt-1.5 text-sm font-semibold">
                  {atencion}%
                </p>
              </div>
            </div>
          </section>

          {/* LISTADO */}

          <section className="mt-5 overflow-hidden rounded-[24px] border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400 sm:text-[10px]">
                    Actividad de clientes
                  </p>

                  <h3 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
                    Valoraciones y comentarios
                  </h3>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="activity" size={16} />
                </div>
              </div>

              <p className="mt-2 text-[11px] leading-5 text-neutral-500 sm:text-xs">
                Filtrá las respuestas para encontrar rápidamente
                lo que querés revisar.
              </p>

              {/* BUSCADOR */}

              <div className="mt-5">
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                    <Icon name="search" size={16} />
                  </div>

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Buscar en comentarios..."
                    className="w-full rounded-xl border border-neutral-200 bg-[#fafaf9] py-3 pl-10 pr-10 text-xs text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-neutral-900"
                      aria-label="Limpiar búsqueda"
                    >
                      <Icon name="close" size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* FILTROS */}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setViewFilter("all")
                  }
                  className={
                    viewFilter === "all"
                      ? "rounded-xl bg-black px-3 py-2 text-[10px] font-semibold text-white"
                      : "rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[10px] font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
                  }
                >
                  Todas
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewFilter("comments")
                  }
                  className={
                    viewFilter === "comments"
                      ? "rounded-xl bg-black px-3 py-2 text-[10px] font-semibold text-white"
                      : "rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[10px] font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
                  }
                >
                  Con comentario
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setViewFilter("ratings")
                  }
                  className={
                    viewFilter === "ratings"
                      ? "rounded-xl bg-black px-3 py-2 text-[10px] font-semibold text-white"
                      : "rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[10px] font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
                  }
                >
                  Solo valoración
                </button>

                <div className="hidden h-8 w-px bg-neutral-200 sm:block" />

                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      setRatingFilter(
                        String(rating) as RatingFilter
                      )
                    }
                    className={
                      ratingFilter === String(rating)
                        ? "rounded-xl bg-neutral-900 px-3 py-2 text-[10px] font-semibold text-white"
                        : "rounded-xl border border-neutral-200 bg-white px-3 py-2 text-[10px] font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
                    }
                  >
                    {rating} ★
                  </button>
                ))}

                {hayFiltros && (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <Icon name="close" size={13} />
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* RESULTADOS */}

            <div className="border-b border-neutral-100 bg-[#fafaf9] px-5 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-medium text-neutral-500">
                  {filteredFeedback.length}{" "}
                  {filteredFeedback.length === 1
                    ? "resultado"
                    : "resultados"}
                </p>

                {hayFiltros && (
                  <p className="text-[10px] text-neutral-400">
                    Filtros activos
                  </p>
                )}
              </div>
            </div>

            {filteredFeedback.length === 0 ? (
              <div className="px-5 py-14 text-center sm:px-6 sm:py-16">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                  <Icon name="filter" size={19} />
                </div>

                <p className="mt-4 text-sm font-semibold">
                  No encontramos resultados
                </p>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-neutral-500">
                  Probá cambiando los filtros o limpiando
                  la búsqueda.
                </p>

                {hayFiltros && (
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="mt-5 rounded-xl bg-black px-4 py-2.5 text-xs font-semibold text-white"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div>
                {filteredFeedback.map((item) => {
                  const hasComment =
                    Boolean(item.message) &&
                    item.message!.trim() !== "";

                  const isAttention =
                    item.rating <= 2;

                  return (
                    <article
                      key={item.id}
                      className="border-b border-neutral-100 px-5 py-5 last:border-b-0 sm:px-6 sm:py-6"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        {/* RATING */}

                        <div
                          className={
                            isAttention
                              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1ed] text-[10px] font-semibold text-[#c75e4b] sm:h-11 sm:w-11 sm:text-xs"
                              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[10px] font-semibold sm:h-11 sm:w-11 sm:text-xs"
                          }
                        >
                          {item.rating}/5
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <RatingStars
                              rating={item.rating}
                            />

                            {isAttention && (
                              <span className="rounded-full bg-[#fff1ed] px-2 py-1 text-[9px] font-semibold text-[#c75e4b]">
                                Atención
                              </span>
                            )}

                            {!hasComment && (
                              <span className="rounded-full bg-neutral-100 px-2 py-1 text-[9px] font-medium text-neutral-400">
                                Sin comentario
                              </span>
                            )}

                            <span className="text-[10px] text-neutral-400 sm:text-[11px]">
                              {formatDateTime(
                                item.created_at
                              )}
                            </span>
                          </div>

                          {hasComment ? (
                            <p className="mt-3 text-xs leading-6 text-neutral-700 sm:text-sm sm:leading-7">
                              {item.message}
                            </p>
                          ) : (
                            <p className="mt-3 text-xs leading-5 text-neutral-400">
                              El cliente dejó solamente una
                              valoración.
                            </p>
                          )}

                          <p className="mt-3 text-[9px] text-neutral-400">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {/* LECTURA DEL PRODUCTO */}

          <section className="mt-4 rounded-[22px] border border-neutral-200 bg-white px-5 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f0f4]">
                <Icon name="activity" size={16} />
              </div>

              <div>
                <p className="text-xs font-semibold sm:text-sm">
                  Cómo leer esta sección
                </p>

                <p className="mt-1 text-[10px] leading-5 text-neutral-500 sm:text-xs sm:leading-6">
                  Las valoraciones muestran qué tan buena fue
                  la experiencia. Los comentarios agregan el
                  contexto necesario para entender qué ocurrió.
                  GuestTap usa esa información como base para
                  detectar señales y oportunidades de mejora.
                </p>
              </div>
            </div>
          </section>

          <footer className="py-8 text-center">
            <p className="text-[9px] text-neutral-400 sm:text-[10px]">
              GuestTap · Panel de gestión
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}