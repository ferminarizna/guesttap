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

const translations = {
  es: {
    question: "¿Qué te pareció?",
    subtitle: "Tu opinión nos ayuda a mejorar.",
    excellent: "Excelente",
    veryGood: "Muy bueno",
    good: "Bueno",
    improve: "Puede mejorar",
    happyTitle: "¡Nos alegra que hayas tenido una buena experiencia!",
    happyText: "Si querés, podés compartir tu experiencia en Google.",
    google: "Dejar reseña en Google",
    later: "Ahora no",
    privateTitle: "Queremos mejorar",
    privateText: "Contanos brevemente qué podríamos hacer mejor.",
    placeholder: "Contanos qué pasó...",
    send: "Enviar comentario",
    sentTitle: "Gracias por tu opinión",
    sentText: "Tu comentario fue enviado al establecimiento.",
    back: "Volver",
    loading: "Cargando...",
  },

  en: {
    question: "How was your experience?",
    subtitle: "Your feedback helps us improve.",
    excellent: "Excellent",
    veryGood: "Very good",
    good: "Good",
    improve: "Could be better",
    happyTitle: "We're glad you had a great experience!",
    happyText: "If you'd like, you can share your experience on Google.",
    google: "Leave a Google review",
    later: "Not now",
    privateTitle: "We want to improve",
    privateText: "Tell us briefly what we could do better.",
    placeholder: "Tell us what happened...",
    send: "Send feedback",
    sentTitle: "Thank you for your feedback",
    sentText: "Your comment was sent to the business.",
    back: "Back",
    loading: "Loading...",
  },

  pt: {
    question: "O que você achou?",
    subtitle: "Sua opinião nos ajuda a melhorar.",
    excellent: "Excelente",
    veryGood: "Muito bom",
    good: "Bom",
    improve: "Pode melhorar",
    happyTitle: "Ficamos felizes que você teve uma boa experiência!",
    happyText: "Se quiser, você pode compartilhar sua experiência no Google.",
    google: "Deixar avaliação no Google",
    later: "Agora não",
    privateTitle: "Queremos melhorar",
    privateText: "Conte brevemente o que poderíamos fazer melhor.",
    placeholder: "Conte o que aconteceu...",
    send: "Enviar comentário",
    sentTitle: "Obrigado pela sua opinião",
    sentText: "Seu comentário foi enviado ao estabelecimento.",
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

export default function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [language, setLanguage] = useState<Language>("es");
  const [loading, setLoading] = useState(true);

  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function cargarNegocio() {
      const { slug } = await params;

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, name, slug, google_url, instagram_url, whatsapp, logo_url"
        )
        .eq("slug", slug)
        .single();

      if (error || !data) {
        router.push("/_not-found");
        return;
      }

      setBusiness(data);
      setLanguage(detectarIdioma());
      setLoading(false);
    }

    cargarNegocio();
  }, [params, router]);

  if (loading || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-400">
          {translations[language].loading}
        </p>
      </main>
    );
  }

  const businessId = business.id;
  const t = translations[language];

  const iniciales = business.name
    .split(" ")
    .slice(0, 2)
    .map((palabra: string) => palabra[0])
    .join("")
    .toUpperCase();

  async function enviarFeedback() {
    if (!selectedRating || !message.trim()) {
      return;
    }

    setSending(true);

    const { error } = await supabase.from("feedback").insert({
      message: message.trim(),
      rating: selectedRating,
      business_id: businessId,
    });

    if (error) {
      console.error(error);
      alert("No se pudo enviar el comentario.");
      setSending(false);
      return;
    }

    setSending(false);
    setSent(true);
  }

  function seleccionarRating(rating: number) {
    setSelectedRating(rating);
    setMessage("");
    setSent(false);
  }

  function volverInicio() {
    setSelectedRating(null);
    setMessage("");
    setSent(false);
  }

  const mostrarFeedbackPrivado =
    selectedRating !== null && selectedRating <= 3;

  const mostrarGoogle =
    selectedRating !== null && selectedRating >= 4;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-neutral-900">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-6">

        {/* IDIOMA */}
        <div className="flex justify-end">
          <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
            {(["es", "en", "pt"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide transition ${
                  language === lang
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-400 hover:text-neutral-700"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* NEGOCIO */}
        <div className="mt-8 text-center">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={`Logo de ${business.name}`}
              className="mx-auto h-24 w-24 rounded-[28px] object-cover shadow-md ring-1 ring-black/5"
            />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-neutral-900 text-2xl font-semibold text-white shadow-md">
              {iniciales}
            </div>
          )}

          <h1 className="mt-5 text-[25px] font-semibold tracking-tight">
            {business.name}
          </h1>
        </div>

        {/* VALORACIÓN INICIAL */}
        {selectedRating === null && (
          <div className="mt-8 rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="text-center">
              <h2 className="text-[21px] font-semibold tracking-tight">
                {t.question}
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                {t.subtitle}
              </p>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                onClick={() => seleccionarRating(5)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-left transition active:scale-[0.99] hover:border-neutral-300 hover:bg-neutral-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                  ⭐
                </span>

                <span className="flex-1">
                  <span className="block text-sm font-semibold">
                    {t.excellent}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-400">
                    ⭐⭐⭐⭐⭐
                  </span>
                </span>

                <span className="text-neutral-300 group-hover:text-neutral-500">
                  →
                </span>
              </button>

              <button
                onClick={() => seleccionarRating(4)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-left transition active:scale-[0.99] hover:border-neutral-300 hover:bg-neutral-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                  ⭐
                </span>

                <span className="flex-1">
                  <span className="block text-sm font-semibold">
                    {t.veryGood}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-400">
                    ⭐⭐⭐⭐
                  </span>
                </span>

                <span className="text-neutral-300 group-hover:text-neutral-500">
                  →
                </span>
              </button>

              <button
                onClick={() => seleccionarRating(3)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-left transition active:scale-[0.99] hover:border-neutral-300 hover:bg-neutral-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                  ⭐
                </span>

                <span className="flex-1">
                  <span className="block text-sm font-semibold">
                    {t.good}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-400">
                    ⭐⭐⭐
                  </span>
                </span>

                <span className="text-neutral-300 group-hover:text-neutral-500">
                  →
                </span>
              </button>

              <button
                onClick={() => seleccionarRating(2)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 text-left transition active:scale-[0.99] hover:border-neutral-300 hover:bg-neutral-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                  ⭐
                </span>

                <span className="flex-1">
                  <span className="block text-sm font-semibold">
                    {t.improve}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-400">
                    ⭐⭐
                  </span>
                </span>

                <span className="text-neutral-300 group-hover:text-neutral-500">
                  →
                </span>
              </button>
            </div>
          </div>
        )}

        {/* EXPERIENCIA POSITIVA */}
        {mostrarGoogle && (
          <div className="mt-8 rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-2xl">
              ✓
            </div>

            <h2 className="mt-5 text-[21px] font-semibold tracking-tight">
              {t.happyTitle}
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {t.happyText}
            </p>

            {business.google_url && (
              <a
                href={business.google_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.99]"
              >
                ⭐ {t.google}
              </a>
            )}

            <button
              onClick={volverInicio}
              className="mt-3 w-full rounded-2xl px-5 py-3 text-sm font-medium text-neutral-400 hover:text-neutral-700"
            >
              {t.later}
            </button>
          </div>
        )}

        {/* FEEDBACK PRIVADO */}
        {mostrarFeedbackPrivado && !sent && (
          <div className="mt-8 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-[21px] font-semibold tracking-tight">
              {t.privateTitle}
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {t.privateText}
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.placeholder}
              className="mt-6 min-h-36 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm outline-none transition focus:border-neutral-400 focus:bg-white"
            />

            <button
              onClick={enviarFeedback}
              disabled={!message.trim() || sending}
              className="mt-3 w-full rounded-2xl bg-neutral-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {sending ? "..." : t.send}
            </button>

            <button
              onClick={volverInicio}
              className="mt-3 w-full rounded-2xl px-5 py-3 text-sm font-medium text-neutral-400 hover:text-neutral-700"
            >
              {t.back}
            </button>
          </div>
        )}

        {/* FEEDBACK ENVIADO */}
        {sent && (
          <div className="mt-8 rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-2xl">
              ✓
            </div>

            <h2 className="mt-5 text-[21px] font-semibold tracking-tight">
              {t.sentTitle}
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              {t.sentText}
            </p>
          </div>
        )}

        {/* OTROS CANALES */}
        {selectedRating === null &&
          (business.instagram_url || business.whatsapp) && (
            <div className="mt-5 space-y-2.5">
              {business.instagram_url && (
                <a
                  href={business.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-medium shadow-sm transition hover:bg-neutral-50 active:scale-[0.99]"
                >
                  Instagram
                </a>
              )}

              {business.whatsapp && (
                <a
                  href={business.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm font-medium shadow-sm transition hover:bg-neutral-50 active:scale-[0.99]"
                >
                  WhatsApp
                </a>
              )}
            </div>
          )}

        {/* FOOTER */}
        <div className="mt-auto pb-2 pt-10 text-center">
          <p className="text-[11px] font-medium tracking-wide text-neutral-300">
            POWERED BY GUESTTAP
          </p>
        </div>
      </section>
    </main>
  );
}