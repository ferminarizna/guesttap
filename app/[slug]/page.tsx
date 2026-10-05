"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    experienceLabel: "TU EXPERIENCIA",
    question: "¿Cómo fue tu experiencia?",
    subtitle: "Tu opinión nos ayuda a mejorar.",
    terrible: "Muy mala",
    excellent: "Excelente",
    privateFeedback: "Tu valoración se registra de forma privada.",
    ratingSelected: "Gracias por tu valoración.",
    ratingPrivate: "Tu valoración fue registrada.",
    shareText:
      "Si querés contar cómo fue tu experiencia, también podés compartirla en Google.",
    google: "Compartir en Google",
    feedbackOption: "Contarnos qué podemos mejorar",
    feedbackTitle: "Queremos escucharte",
    feedbackText:
      "Contanos brevemente qué podríamos hacer mejor. Tu comentario ayuda al establecimiento a mejorar.",
    placeholder: "Contanos qué pasó...",
    send: "Enviar comentario",
    sentTitle: "Gracias por tu opinión",
    sentText: "Tu comentario fue enviado al establecimiento.",
    back: "Volver",
    loading: "Cargando...",
    finish: "Terminar",
    notNow: "Ahora no",
  },

  en: {
    experienceLabel: "YOUR EXPERIENCE",
    question: "How was your experience?",
    subtitle: "Your feedback helps us improve.",
    terrible: "Very poor",
    excellent: "Excellent",
    privateFeedback: "Your rating is recorded privately.",
    ratingSelected: "Thanks for your rating.",
    ratingPrivate: "Your rating was recorded.",
    shareText:
      "If you'd like to tell others about your experience, you can also share it on Google.",
    google: "Share on Google",
    feedbackOption: "Tell us what we could improve",
    feedbackTitle: "We want to hear from you",
    feedbackText:
      "Tell us briefly what we could do better. Your feedback helps the business improve.",
    placeholder: "Tell us what happened...",
    send: "Send feedback",
    sentTitle: "Thank you for your feedback",
    sentText: "Your comment was sent to the business.",
    back: "Back",
    loading: "Loading...",
    finish: "Finish",
    notNow: "Not now",
  },

  pt: {
    experienceLabel: "SUA EXPERIÊNCIA",
    question: "Como foi sua experiência?",
    subtitle: "Sua opinião nos ajuda a melhorar.",
    terrible: "Muito ruim",
    excellent: "Excelente",
    privateFeedback: "Sua avaliação é registrada de forma privada.",
    ratingSelected: "Obrigado pela sua avaliação.",
    ratingPrivate: "Sua avaliação foi registrada.",
    shareText:
      "Se quiser contar como foi sua experiência, você também pode compartilhá-la no Google.",
    google: "Compartilhar no Google",
    feedbackOption: "Conte o que podemos melhorar",
    feedbackTitle: "Queremos ouvir você",
    feedbackText:
      "Conte brevemente o que poderíamos fazer melhor. Seu comentário ajuda o estabelecimento a melhorar.",
    placeholder: "Conte o que aconteceu...",
    send: "Enviar comentário",
    sentTitle: "Obrigado pela sua opinião",
    sentText: "Seu comentário foi enviado ao estabelecimento.",
    back: "Voltar",
    loading: "Carregando...",
    finish: "Finalizar",
    notNow: "Agora não",
  },
};

function detectarIdioma(): Language {
  if (typeof navigator === "undefined") return "es";

  const idioma = navigator.language.toLowerCase();

  if (idioma.startsWith("pt")) return "pt";
  if (idioma.startsWith("en")) return "en";

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

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle
        cx="17.4"
        cy="6.6"
        r="0.7"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.2 11.3a8.1 8.1 0 0 1-12 7.1L4 19.5l1.1-3.9A8.1 8.1 0 1 1 20.2 11.3Z" />
      <path d="M8.7 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.5c.1.3.1.5-.1.7l-.5.6c-.1.1-.1.3 0 .5.4.7 1 1.3 1.7 1.7.2.1.4.1.5 0l.6-.5c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.5v.5c0 .3 0 .5-.4.7-.4.2-1 .3-1.4.2-1.1-.2-2.3-.8-3.2-1.7-.9-.9-1.5-2-1.7-3.2-.1-.4 0-1 .2-1.4Z" />
    </svg>
  );
}

export default function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [business, setBusiness] = useState<Business | null>(null);
  const [language, setLanguage] = useState<Language>("es");
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("rating");
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [scanEventId, setScanEventId] = useState<number | null>(null);

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

      const scanParam = searchParams.get("scan");
      const parsedScanId = scanParam ? Number(scanParam) : NaN;

      if (Number.isInteger(parsedScanId) && parsedScanId > 0) {
        setScanEventId(parsedScanId);
      }

      setLanguage(detectarIdioma());
      setLoading(false);
    }

    cargarNegocio();
  }, [params, router, searchParams]);

  if (loading || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f8f9]">
        <p className="text-[10px] font-medium tracking-[0.24em] text-[#9aa0a6]">
          {translations[language].loading}
        </p>
      </main>
    );
  }

  const currentBusiness = business;
  const businessId = currentBusiness.id;
  const t = translations[language];

  const iniciales = currentBusiness.name
    .split(" ")
    .slice(0, 2)
    .map((palabra: string) => palabra[0])
    .join("")
    .toUpperCase();

  async function guardarRating(rating: number) {
    const { error } = await supabase.from("feedback").insert({
      rating,
      business_id: businessId,
      message: null,
      scan_event_id: scanEventId,
    });

    if (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  async function seleccionarRating(rating: number) {
    setSelectedRating(rating);
    setHoveredRating(null);
    setMessage("");

    if (rating >= 4) {
      const guardado = await guardarRating(rating);

      if (!guardado) {
        alert("No se pudo registrar la valoración.");
        return;
      }
    }

    setStep("result");
  }

  async function finalizarRating() {
    if (!selectedRating) return;

    if (selectedRating <= 3) {
      const guardado = await guardarRating(selectedRating);

      if (!guardado) {
        alert("No se pudo registrar la valoración.");
        return;
      }
    }

    setStep("sent");
  }

  async function enviarFeedback() {
    if (!selectedRating || !message.trim()) return;

    setSending(true);

    const { error } = await supabase.from("feedback").insert({
      message: message.trim(),
      rating: selectedRating,
      business_id: businessId,
      scan_event_id: scanEventId,
    });

    if (error) {
      console.error(error);
      alert("No se pudo enviar el comentario.");
      setSending(false);
      return;
    }

    setSending(false);
    setStep("sent");
  }

  function volverInicio() {
    setSelectedRating(null);
    setHoveredRating(null);
    setMessage("");
    setStep("rating");
  }

  function irAFeedback() {
    setStep("feedback");
  }

  function abrirGoogle() {
    if (!currentBusiness.google_url) return;

    window.open(
      currentBusiness.google_url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const ratingToShow = hoveredRating ?? selectedRating ?? 0;

  return (
    <main className="min-h-screen bg-[#f7f8f9] text-[#111315]">
      <section className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 sm:py-6 lg:px-10">
        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {currentBusiness.logo_url ? (
              <img
                src={currentBusiness.logo_url}
                alt={`Logo de ${currentBusiness.name}`}
                className="h-10 w-10 rounded-[10px] object-cover ring-1 ring-black/[0.08] sm:h-11 sm:w-11"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#111315] text-[10px] font-semibold text-white sm:h-11 sm:w-11">
                {iniciales}
              </div>
            )}

            <span className="truncate text-[13px] font-semibold tracking-[-0.015em] sm:text-[14px]">
              {currentBusiness.name}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-[0.12em]">
            {(["es", "en", "pt"] as Language[]).map((lang, index) => (
              <span key={lang} className="flex items-center">
                {index > 0 && (
                  <span className="mr-2 text-[#c9cdd1]">/</span>
                )}

                <button
                  onClick={() => setLanguage(lang)}
                  className={`transition ${
                    language === lang
                      ? "text-[#111315]"
                      : "text-[#a4a9ae] hover:text-[#555b60]"
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              </span>
            ))}
          </div>
        </header>

        <div className="mt-5 h-px bg-[#dfe2e4]" />

        {/* MAIN */}
        <div className="relative flex flex-1 items-center justify-center">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[90px]"
            style={{
              background:
                "radial-gradient(circle, rgba(225,231,236,0.7) 0%, rgba(247,248,249,0) 70%)",
            }}
          />

          {step === "rating" && (
            <div className="relative w-full max-w-[760px] -translate-y-[3%] py-10 text-center sm:py-14">
              <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#9ca2a7]">
                {t.experienceLabel}
              </p>

              <h1 className="mx-auto mt-5 max-w-[700px] text-[34px] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[48px] lg:text-[54px]">
                {t.question}
              </h1>

              <p className="mt-5 text-[13px] text-[#747b81] sm:text-[14px]">
                {t.subtitle}
              </p>

              {/* ESTRELLAS */}
              <div
                className="mt-11 flex items-center justify-center gap-3 sm:mt-14 sm:gap-7"
                onMouseLeave={() => setHoveredRating(null)}
              >
                {[1, 2, 3, 4, 5].map((rating) => {
                  const active = rating <= ratingToShow;

                  return (
                    <button
                      key={rating}
                      type="button"
                      aria-label={`${rating} estrellas`}
                      onMouseEnter={() => setHoveredRating(rating)}
                      onFocus={() => setHoveredRating(rating)}
                      onClick={() => seleccionarRating(rating)}
                      className="group flex h-14 w-10 items-center justify-center transition duration-200 hover:scale-[1.1] active:scale-90 sm:h-16 sm:w-12"
                    >
                      <StarIcon
                        filled={active}
                        className={`h-9 w-9 transition-all duration-200 sm:h-11 sm:w-11 ${
                          active
                            ? "text-[#111315] drop-shadow-[0_5px_10px_rgba(17,19,21,0.12)]"
                            : "text-[#bfc4c8] group-hover:text-[#666d73]"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mx-auto mt-2 flex max-w-[440px] items-center justify-between px-1 text-[10px] font-medium text-[#9ba1a6] sm:text-[11px]">
                <span>{t.terrible}</span>
                <span>{t.excellent}</span>
              </div>

              <div className="mx-auto mt-10 flex max-w-[400px] items-center justify-center gap-4">
                <span className="h-px flex-1 bg-[#dfe2e4]" />

                <span className="whitespace-nowrap text-[9px] text-[#9da3a8]">
                  {t.privateFeedback}
                </span>

                <span className="h-px flex-1 bg-[#dfe2e4]" />
              </div>
            </div>
          )}

          {/* RESULTADO */}
          {step === "result" && selectedRating !== null && (
            <div className="relative w-full max-w-[620px] py-12 text-center">
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    filled={star <= selectedRating}
                    className={`h-9 w-9 ${
                      star <= selectedRating
                        ? "text-[#111315]"
                        : "text-[#c8cdd1]"
                    }`}
                  />
                ))}
              </div>

              <h2 className="mt-8 text-[31px] font-semibold tracking-[-0.045em] sm:text-[40px]">
                {t.ratingSelected}
              </h2>

              <p className="mx-auto mt-4 max-w-[460px] text-[13px] leading-6 text-[#747b81]">
                {t.ratingPrivate}
              </p>

              {currentBusiness.google_url && (
                <div className="mx-auto mt-9 max-w-[440px]">
                  <p className="text-[13px] leading-5 text-[#747b81]">
                    {t.shareText}
                  </p>

                  <button
                    onClick={abrirGoogle}
                    className="mt-5 w-full rounded-[12px] bg-[#111315] px-6 py-4 text-[13px] font-semibold text-white transition hover:bg-[#272b2f] active:scale-[0.99]"
                  >
                    {t.google}
                  </button>
                </div>
              )}

              <button
                onClick={irAFeedback}
                className="mt-6 text-[12px] font-medium text-[#6d747a] underline decoration-[#c9cdd1] underline-offset-4 transition hover:text-[#111315]"
              >
                {t.feedbackOption}
              </button>

              <div>
                <button
                  onClick={finalizarRating}
                  className="mt-6 text-[11px] text-[#a1a7ac] transition hover:text-[#555b60]"
                >
                  {t.notNow}
                </button>
              </div>
            </div>
          )}

          {/* FEEDBACK */}
          {step === "feedback" && selectedRating !== null && (
            <div className="relative w-full max-w-[610px] py-12 text-center">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    filled={star <= selectedRating}
                    className={`h-7 w-7 ${
                      star <= selectedRating
                        ? "text-[#111315]"
                        : "text-[#c8cdd1]"
                    }`}
                  />
                ))}
              </div>

              <h2 className="mt-8 text-[30px] font-semibold tracking-[-0.045em] sm:text-[38px]">
                {t.feedbackTitle}
              </h2>

              <p className="mx-auto mt-4 max-w-[480px] text-[13px] leading-6 text-[#747b81]">
                {t.feedbackText}
              </p>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.placeholder}
                maxLength={2000}
                className="mx-auto mt-8 block min-h-[150px] w-full resize-none rounded-[14px] border border-[#d8dcdf] bg-white p-5 text-[14px] leading-6 text-[#111315] outline-none transition placeholder:text-[#a5abb0] focus:border-[#92999f]"
              />

              <div className="mt-2 text-right text-[10px] text-[#a1a7ac]">
                {message.length}/2000
              </div>

              <button
                onClick={enviarFeedback}
                disabled={!message.trim() || sending}
                className="mt-4 w-full rounded-[12px] bg-[#111315] px-6 py-4 text-[13px] font-semibold text-white transition hover:bg-[#272b2f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? "..." : t.send}
              </button>

              <button
                onClick={() => setStep("result")}
                className="mt-5 text-[11px] text-[#a1a7ac] transition hover:text-[#555b60]"
              >
                {t.back}
              </button>
            </div>
          )}

          {/* FINAL */}
          {step === "sent" && (
            <div className="relative w-full max-w-[610px] py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#111315] text-lg text-white">
                ✓
              </div>

              <h2 className="mt-8 text-[31px] font-semibold tracking-[-0.045em] sm:text-[40px]">
                {t.sentTitle}
              </h2>

              <p className="mt-4 text-[13px] leading-6 text-[#747b81]">
                {t.sentText}
              </p>

              <button
                onClick={volverInicio}
                className="mt-8 rounded-[12px] bg-[#111315] px-8 py-4 text-[13px] font-semibold text-white transition hover:bg-[#272b2f] active:scale-[0.99]"
              >
                {t.finish}
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="flex items-center justify-between border-t border-[#dfe2e4] pt-5">
          <div className="flex items-center gap-5">
            {step === "rating" && currentBusiness.instagram_url && (
              <a
                href={currentBusiness.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-medium text-[#858c92] transition hover:text-[#111315] sm:text-[11px]"
              >
                <InstagramIcon className="h-3.5 w-3.5" />
                Instagram
              </a>
            )}

            {step === "rating" && currentBusiness.whatsapp && (
              <a
                href={currentBusiness.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-medium text-[#858c92] transition hover:text-[#111315] sm:text-[11px]"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
          </div>

          <span className="text-[8px] font-semibold tracking-[0.25em] text-[#b5bbc0]">
            GUESTTAP
          </span>
        </footer>
      </section>
    </main>
  );
}