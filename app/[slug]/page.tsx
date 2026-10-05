"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Language = "es" | "en" | "pt";

type Business = {
  id: number;
  name: string;
  slug: string;
  google_url: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
  logo_url: string | null;
};

type Step = "rating" | "result" | "feedback" | "sent";

const translations = {
  es: {
    experience: "Tu experiencia",
    question: "¿Cómo fue tu experiencia?",
    subtitle: "Tu opinión nos ayuda a mejorar.",
    thanks: "Gracias por tu valoración.",
    share: "¿Querés compartir tu experiencia?",
    google: "Compartir en Google",
    feedback: "Contarnos qué podemos mejorar",
    notNow: "Ahora no",
    feedbackTitle: "Queremos escucharte",
    feedbackText:
      "Contanos brevemente qué podríamos hacer mejor.",
    placeholder: "Contanos qué pasó...",
    send: "Enviar comentario",
    sentTitle: "Gracias por tu opinión.",
    sentText: "Tu experiencia fue registrada correctamente.",
    finish: "Terminar",
    back: "Volver",
    loading: "Cargando...",
  },

  en: {
    experience: "Your experience",
    question: "How was your experience?",
    subtitle: "Your feedback helps us improve.",
    thanks: "Thanks for your rating.",
    share: "Would you like to share your experience?",
    google: "Share on Google",
    feedback: "Tell us what we could improve",
    notNow: "Not now",
    feedbackTitle: "We want to hear from you",
    feedbackText:
      "Tell us briefly what we could do better.",
    placeholder: "Tell us what happened...",
    send: "Send feedback",
    sentTitle: "Thank you for your feedback.",
    sentText: "Your experience was successfully recorded.",
    finish: "Finish",
    back: "Back",
    loading: "Loading...",
  },

  pt: {
    experience: "Sua experiência",
    question: "Como foi sua experiência?",
    subtitle: "Sua opinião nos ajuda a melhorar.",
    thanks: "Obrigado pela sua avaliação.",
    share: "Quer compartilhar sua experiência?",
    google: "Compartilhar no Google",
    feedback: "Conte o que podemos melhorar",
    notNow: "Agora não",
    feedbackTitle: "Queremos ouvir você",
    feedbackText:
      "Conte brevemente o que poderíamos fazer melhor.",
    placeholder: "Conte o que aconteceu...",
    send: "Enviar comentário",
    sentTitle: "Obrigado pela sua opinião.",
    sentText: "Sua experiência foi registrada corretamente.",
    finish: "Finalizar",
    back: "Voltar",
    loading: "Carregando...",
  },
};

function detectarIdioma(): Language {
  if (typeof navigator === "undefined") {
    return "es";
  }

  const idioma = navigator.language.toLowerCase();

  if (idioma.startsWith("pt")) {
    return "pt";
  }

  if (idioma.startsWith("en")) {
    return "en";
  }

  return "es";
}

function StarIcon({
  filled = false,
  className = "",
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 3.5l2.65 5.37 5.93.86-4.29 4.18 1.01 5.91L12 17.03l-5.3 2.79 1.01-5.91-4.29-4.18 5.93-.86L12 3.5z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle
        cx="17.4"
        cy="6.6"
        r="0.8"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M20 11.2a8 8 0 0 1-11.8 7L4 19l.9-4.1A8 8 0 1 1 20 11.2Z" />
      <path d="M8.5 8.4c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.2.1.4-.1.6l-.5.6c.7 1.2 1.5 1.9 2.7 2.4l.6-.7c.2-.2.4-.2.6-.1l1.4.7c.2.1.3.3.2.5-.2.7-.8 1.2-1.5 1.3-1.1.1-2.9-.8-4.1-1.9-1.2-1.1-2.1-2.8-2.2-3.9-.1-.3.1-.7.6-.9Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.2 4.2L19 7" />
    </svg>
  );
}

export default function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [language, setLanguage] = useState<Language>("es");
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("rating");
  const [selectedRating, setSelectedRating] = useState<number | null>(
    null
  );
  const [hoveredRating, setHoveredRating] = useState<number | null>(
    null
  );

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    async function cargarNegocio() {
      const { slug } = await params;

      const { data, error } = await supabase.rpc(
        "get_public_business_by_slug",
        {
          requested_slug: slug,
        }
      );

      if (error || !data || data.length === 0) {
        router.push("/_not-found");
        return;
      }

      setBusiness(data[0]);
      setLanguage(detectarIdioma());
      setLoading(false);
    }

    cargarNegocio();
  }, [params, router]);

  if (loading || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f3ed]">
        <p className="text-sm text-neutral-400">
          {translations[language].loading}
        </p>
      </main>
    );
  }

  const currentBusiness = business;
  const t = translations[language];

  const iniciales = currentBusiness.name
    .split(" ")
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join("")
    .toUpperCase();

  const ratingToShow = hoveredRating ?? selectedRating ?? 0;

  async function guardarValoracion(
    rating: number,
    feedbackMessage: string | null = null
  ) {
    const { error } = await supabase.from("feedback").insert({
      rating,
      business_id: currentBusiness.id,
      message: feedbackMessage,
    });

    if (error) {
      console.error("Error guardando valoración:", error);
      return false;
    }

    return true;
  }

  function seleccionarRating(rating: number) {
    if (sending || finishing) {
      return;
    }

    setSelectedRating(rating);
    setHoveredRating(null);
    setMessage("");
    setStep("result");
  }

  async function finalizarSinComentario() {
    if (!selectedRating || finishing) {
      return;
    }

    setFinishing(true);

    const guardado = await guardarValoracion(selectedRating);

    if (!guardado) {
      setFinishing(false);
      alert("No se pudo registrar la valoración.");
      return;
    }

    setFinishing(false);
    setStep("sent");
  }

  async function compartirGoogle() {
    if (
      !selectedRating ||
      !currentBusiness.google_url ||
      finishing
    ) {
      return;
    }

    setFinishing(true);

    const guardado = await guardarValoracion(selectedRating);

    if (!guardado) {
      setFinishing(false);
      alert("No se pudo registrar la valoración.");
      return;
    }

    window.open(
      currentBusiness.google_url,
      "_blank",
      "noopener,noreferrer"
    );

    setFinishing(false);
    setStep("sent");
  }

  async function enviarFeedback() {
    if (!selectedRating || !message.trim() || sending) {
      return;
    }

    setSending(true);

    const guardado = await guardarValoracion(
      selectedRating,
      message.trim()
    );

    if (!guardado) {
      setSending(false);
      alert("No se pudo enviar el comentario.");
      return;
    }

    setSending(false);
    setStep("sent");
  }

  function volverInicio() {
    setSelectedRating(null);
    setHoveredRating(null);
    setMessage("");
    setSending(false);
    setFinishing(false);
    setStep("rating");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f3ed] text-[#171714]">

      {/* FONDO AMBIENTAL */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-white/75 blur-3xl" />

        <div className="absolute bottom-[-280px] right-[-180px] h-[500px] w-[500px] rounded-full bg-white/35 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1100px] flex-col px-6 sm:px-10 lg:px-14">

        {/* HEADER */}
        <header className="flex items-center justify-between border-b border-neutral-900/[0.07] py-5 sm:py-6">

          {/* NEGOCIO */}
          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden sm:h-12 sm:w-12">
              {currentBusiness.logo_url ? (
                <img
                  src={currentBusiness.logo_url}
                  alt={`Logo de ${currentBusiness.name}`}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-[11px] font-semibold tracking-tight">
                  {iniciales}
                </div>
              )}
            </div>

            <p className="truncate text-[16px] font-semibold tracking-[-0.025em] sm:text-[17px]">
              {currentBusiness.name}
            </p>
          </div>

          {/* IDIOMAS */}
          <div className="ml-4 flex shrink-0 items-center gap-1 rounded-full border border-neutral-200/80 bg-white/60 p-1 backdrop-blur">
            {(["es", "en", "pt"] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`rounded-full px-2.5 py-1.5 text-[9px] font-semibold tracking-[0.08em] transition sm:px-3 ${
                  language === lang
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-400 hover:text-neutral-800"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <div className="flex flex-1 flex-col">

          {/* =========================
              RATING
             ========================= */}
          {step === "rating" && (
            <section className="flex flex-1 flex-col items-center justify-center pb-10 pt-12 sm:pb-14 sm:pt-14">

              <div className="w-full max-w-[760px] text-center">

                <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-neutral-400">
                  {t.experience}
                </p>

                <h1 className="mx-auto max-w-[760px] text-[38px] font-semibold leading-[1.05] tracking-[-0.055em] sm:text-[52px] lg:text-[58px]">
                  {t.question}
                </h1>

                <p className="mx-auto mt-5 max-w-[380px] text-[14px] leading-6 text-neutral-500 sm:text-[15px]">
                  {t.subtitle}
                </p>

                {/* SEPARADOR */}
                <div className="mx-auto mt-10 flex w-full max-w-[520px] items-center gap-5">
                  <div className="h-px flex-1 bg-neutral-900/[0.08]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-neutral-300" />
                  <div className="h-px flex-1 bg-neutral-900/[0.08]" />
                </div>

                {/* ESTRELLAS */}
                <div
                  className="mt-8 flex items-center justify-center gap-2 sm:mt-9 sm:gap-5"
                  onMouseLeave={() => setHoveredRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const active = rating <= ratingToShow;

                    return (
                      <button
                        key={rating}
                        type="button"
                        aria-label={`${rating} estrellas`}
                        onMouseEnter={() =>
                          setHoveredRating(rating)
                        }
                        onFocus={() =>
                          setHoveredRating(rating)
                        }
                        onClick={() =>
                          seleccionarRating(rating)
                        }
                        className="flex h-[64px] w-[64px] items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-90 sm:h-[76px] sm:w-[76px]"
                      >
                        <StarIcon
                          filled={active}
                          className={`h-[43px] w-[43px] transition-all duration-200 sm:h-[49px] sm:w-[49px] ${
                            active
                              ? "text-neutral-950 drop-shadow-[0_5px_8px_rgba(0,0,0,0.08)]"
                              : "text-neutral-300 group-hover:text-neutral-500"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* =========================
              RESULTADO
             ========================= */}
          {step === "result" && selectedRating !== null && (
            <section className="flex flex-1 flex-col items-center justify-center pb-10 pt-12">

              <div className="w-full max-w-[560px] text-center">

                <div className="flex justify-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      filled={star <= selectedRating}
                      className={`h-7 w-7 sm:h-8 sm:w-8 ${
                        star <= selectedRating
                          ? "text-neutral-950"
                          : "text-neutral-200"
                      }`}
                    />
                  ))}
                </div>

                <h1 className="mt-8 text-[34px] font-semibold tracking-[-0.05em] sm:text-[44px]">
                  {t.thanks}
                </h1>

                <p className="mt-4 text-[14px] text-neutral-500 sm:text-[15px]">
                  {t.share}
                </p>

                <div className="mx-auto mt-9 flex w-full max-w-[390px] flex-col gap-3">

                  {currentBusiness.google_url && (
                    <button
                      type="button"
                      onClick={compartirGoogle}
                      disabled={finishing}
                      className="w-full rounded-full bg-neutral-950 px-6 py-4 text-[14px] font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {finishing ? "..." : t.google}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setStep("feedback")}
                    disabled={finishing}
                    className="w-full rounded-full border border-neutral-300 bg-white/50 px-6 py-4 text-[14px] font-semibold text-neutral-900 transition hover:bg-white active:scale-[0.99] disabled:opacity-50"
                  >
                    {t.feedback}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={finalizarSinComentario}
                  disabled={finishing}
                  className="mt-6 text-[13px] text-neutral-400 transition hover:text-neutral-800 disabled:opacity-50"
                >
                  {finishing ? "..." : t.notNow}
                </button>
              </div>
            </section>
          )}

          {/* =========================
              FEEDBACK
             ========================= */}
          {step === "feedback" && selectedRating !== null && (
            <section className="flex flex-1 flex-col items-center justify-center pb-10 pt-12">

              <div className="w-full max-w-[560px]">

                <div className="text-center">

                  <div className="flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        filled={star <= selectedRating}
                        className={`h-7 w-7 ${
                          star <= selectedRating
                            ? "text-neutral-950"
                            : "text-neutral-200"
                        }`}
                      />
                    ))}
                  </div>

                  <h1 className="mt-8 text-[34px] font-semibold tracking-[-0.05em] sm:text-[44px]">
                    {t.feedbackTitle}
                  </h1>

                  <p className="mx-auto mt-4 max-w-[390px] text-[14px] leading-6 text-neutral-500">
                    {t.feedbackText}
                  </p>
                </div>

                <div className="mt-9">
                  <textarea
                    value={message}
                    onChange={(e) =>
                      setMessage(e.target.value)
                    }
                    placeholder={t.placeholder}
                    maxLength={2000}
                    className="min-h-[180px] w-full resize-none rounded-[24px] border border-neutral-200 bg-white/70 p-5 text-[14px] leading-6 outline-none shadow-[0_10px_35px_rgba(0,0,0,0.035)] transition placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white"
                  />

                  <div className="mt-2 text-right text-[10px] text-neutral-400">
                    {message.length}/2000
                  </div>
                </div>

                <button
                  type="button"
                  onClick={enviarFeedback}
                  disabled={!message.trim() || sending}
                  className="mt-4 w-full rounded-full bg-neutral-950 px-6 py-4 text-[14px] font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {sending ? "..." : t.send}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("result")}
                  disabled={sending}
                  className="mt-4 block w-full text-center text-[13px] text-neutral-400 transition hover:text-neutral-800 disabled:opacity-50"
                >
                  {t.back}
                </button>
              </div>
            </section>
          )}

          {/* =========================
              FINAL
             ========================= */}
          {step === "sent" && (
            <section className="flex flex-1 flex-col items-center justify-center pb-10 pt-12 text-center">

              <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full border border-neutral-300 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.07)]">
                <CheckIcon />
              </div>

              <h1 className="mt-8 text-[34px] font-semibold tracking-[-0.05em] sm:text-[44px]">
                {t.sentTitle}
              </h1>

              <p className="mt-4 max-w-[350px] text-[14px] leading-6 text-neutral-500">
                {t.sentText}
              </p>

              <button
                type="button"
                onClick={volverInicio}
                className="mt-9 rounded-full bg-neutral-950 px-9 py-4 text-[14px] font-semibold text-white transition hover:bg-neutral-800 active:scale-[0.99]"
              >
                {t.finish}
              </button>
            </section>
          )}

          {/* =========================
              FOOTER
             ========================= */}
          {step === "rating" && (
            <footer className="flex flex-col items-center justify-between gap-5 border-t border-neutral-900/[0.07] pb-6 pt-6 sm:flex-row">

              <div className="flex items-center gap-3">

                {currentBusiness.instagram_url && (
                  <a
                    href={currentBusiness.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/45 px-4 py-2.5 text-[12px] font-medium text-neutral-500 transition hover:border-neutral-300 hover:bg-white hover:text-neutral-900"
                  >
                    <InstagramIcon />
                    Instagram
                  </a>
                )}

                {currentBusiness.whatsapp && (
                  <a
                    href={currentBusiness.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/45 px-4 py-2.5 text-[12px] font-medium text-neutral-500 transition hover:border-neutral-300 hover:bg-white hover:text-neutral-900"
                  >
                    <WhatsAppIcon />
                    WhatsApp
                  </a>
                )}
              </div>

              <span className="text-[9px] font-medium lowercase tracking-[0.2em] text-neutral-300">
                guesttap
              </span>
            </footer>
          )}

          {step !== "rating" && (
            <footer className="pb-6 pt-6 text-center">
              <span className="text-[9px] font-medium lowercase tracking-[0.2em] text-neutral-300">
                guesttap
              </span>
            </footer>
          )}
        </div>
      </div>
    </main>
  );
}