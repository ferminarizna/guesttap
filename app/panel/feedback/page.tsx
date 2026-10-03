"use client";

import { useEffect, useState } from "react";
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

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "message" | "star" | "activity";
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

export default function FeedbackPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const promedio =
    feedback.length > 0
      ? (
          feedback.reduce(
            (total, item) => total + item.rating,
            0
          ) / feedback.length
        ).toFixed(1)
      : "0.0";

  const privados = feedback.filter(
    (item) => item.message && item.message.trim() !== ""
  );

  const positivas =
    feedback.length > 0
      ? Math.round(
          (feedback.filter((item) => item.rating >= 4).length /
            feedback.length) *
            100
        )
      : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] px-4 py-5 sm:p-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="animate-pulse">
            <div className="h-10 w-40 rounded-xl bg-neutral-200" />

            <div className="mt-7 h-28 rounded-[24px] bg-neutral-100" />

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-2xl bg-neutral-100"
                />
              ))}
            </div>

            <div className="mt-5 h-80 rounded-[24px] bg-neutral-100" />
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
              Revisá las opiniones que tus clientes dejan a través de GuestTap.
            </p>

          </section>

          {/* RESUMEN */}

          <section className="mt-6 overflow-hidden rounded-[24px] bg-[#111111] text-white sm:mt-8">

            <div className="grid sm:grid-cols-[1.1fr_0.9fr]">

              {/* PROMEDIO */}

              <div className="p-5 sm:p-7">

                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 sm:text-[10px]">
                  Resumen
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

              <div className="grid grid-cols-2 border-t border-white/10 sm:border-l sm:border-t-0">

                <div className="border-r border-white/10 p-5 sm:p-7">

                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 sm:text-[10px]">
                    Positivas
                  </p>

                  <p className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {positivas}%
                  </p>

                  <p className="mt-1 text-[10px] text-white/40 sm:text-xs">
                    4 y 5 estrellas
                  </p>

                </div>

                <div className="p-5 sm:p-7">

                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 sm:text-[10px]">
                    Comentarios
                  </p>

                  <p className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                    {privados.length}
                  </p>

                  <p className="mt-1 text-[10px] text-white/40 sm:text-xs">
                    feedback privado
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* LISTADO */}

          <section className="mt-5 overflow-hidden rounded-[24px] border border-neutral-200 bg-white">

            <div className="border-b border-neutral-200 px-5 py-5 sm:px-6">

              <div className="flex items-center justify-between gap-4">

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400 sm:text-[10px]">
                    Feedback privado
                  </p>

                  <h3 className="mt-1 text-base font-semibold tracking-tight sm:text-lg">
                    Comentarios de clientes
                  </h3>
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="message" size={16} />
                </div>

              </div>

              <p className="mt-2 text-[11px] leading-5 text-neutral-500 sm:text-xs">
                Estos comentarios son privados y solo están disponibles para tu negocio.
              </p>

            </div>

            {privados.length === 0 ? (
              <div className="px-5 py-14 text-center sm:px-6 sm:py-16">

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100">
                  <Icon name="message" size={19} />
                </div>

                <p className="mt-4 text-sm font-semibold">
                  Todavía no hay comentarios
                </p>

                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-neutral-500">
                  Cuando un cliente deje un comentario privado desde GuestTap, aparecerá acá.
                </p>

              </div>
            ) : (
              <div>

                {privados.map((item) => (
                  <article
                    key={item.id}
                    className="border-b border-neutral-100 px-5 py-5 last:border-b-0 sm:px-6 sm:py-6"
                  >

                    <div className="flex gap-3 sm:gap-4">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-[10px] font-semibold sm:h-11 sm:w-11 sm:text-xs">
                        {item.rating}/5
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2.5">

                          <RatingStars rating={item.rating} />

                          <span className="text-[10px] text-neutral-400 sm:text-[11px]">
                            {formatDate(item.created_at)}
                          </span>

                        </div>

                        <p className="mt-3 text-xs leading-6 text-neutral-700 sm:text-sm sm:leading-7">
                          {item.message}
                        </p>

                      </div>

                    </div>

                  </article>
                ))}

              </div>
            )}

          </section>

          {/* TODAS LAS VALORACIONES */}

          <section className="mt-4 rounded-[22px] border border-neutral-200 bg-white px-5 py-5 sm:px-6">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <Icon name="activity" size={16} />
              </div>

              <div>
                <p className="text-xs font-semibold sm:text-sm">
                  {feedback.length}{" "}
                  {feedback.length === 1
                    ? "valoración recibida"
                    : "valoraciones recibidas"}
                </p>

                <p className="mt-0.5 text-[10px] text-neutral-500 sm:text-xs">
                  Incluyendo las valoraciones sin comentario.
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