"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
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
    subtitle: "Compartí tu opinión sobre tu experiencia.",
    excellent: "Excelente",
    veryGood: "Muy bueno",
    good: "Bueno",
    improve: "Puede mejorar",
    google: "Dejar reseña en Google",
    language: "Idioma",
  },
  en: {
    question: "How was your experience?",
    subtitle: "Share your feedback about your experience.",
    excellent: "Excellent",
    veryGood: "Very good",
    good: "Good",
    improve: "Could be better",
    google: "Leave a Google review",
    language: "Language",
  },
  pt: {
    question: "O que você achou?",
    subtitle: "Compartilhe sua opinião sobre sua experiência.",
    excellent: "Excelente",
    veryGood: "Muito bom",
    good: "Bom",
    improve: "Pode melhorar",
    google: "Deixar avaliação no Google",
    language: "Idioma",
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
  const [business, setBusiness] = useState<Business | null>(null);
  const [language, setLanguage] = useState<Language>("es");
  const [loading, setLoading] = useState(true);

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
        notFound();
        return;
      }

      setBusiness(data);
      setLanguage(detectarIdioma());
      setLoading(false);
    }

    cargarNegocio();
  }, [params]);

  if (loading || !business) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-sm text-neutral-500">Cargando...</p>
      </main>
    );
  }

  const t = translations[language];

  const iniciales = business.name
    .split(" ")
    .slice(0, 2)
    .map((palabra: string) => palabra[0])
    .join("")
    .toUpperCase();

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">

        {/* IDIOMA */}
        <div className="flex justify-end">
          <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setLanguage("es")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                language === "es"
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              ES
            </button>

            <button
              onClick={() => setLanguage("en")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                language === "en"
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              EN
            </button>

            <button
              onClick={() => setLanguage("pt")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                language === "pt"
                  ? "bg-black text-white"
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              PT
            </button>
          </div>
        </div>

        {/* NEGOCIO */}
        <div className="mt-6 text-center">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={`Logo de ${business.name}`}
              className="mx-auto h-24 w-24 rounded-3xl object-cover shadow-sm"
            />
          ) : (
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-black text-2xl font-semibold text-white shadow-sm">
              {iniciales}
            </div>
          )}

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            {business.name}
          </h1>
        </div>

        {/* VALORACIÓN */}
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-center text-xl font-semibold tracking-tight">
            {t.question}
          </h2>

          <p className="mt-2 text-center text-sm leading-5 text-neutral-500">
            {t.subtitle}
          </p>

          <div className="mt-7 space-y-3">
            <a
              href={`/feedback?rating=5&business=${business.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
            >
              <span className="font-medium">{t.excellent}</span>
              <span className="text-lg">⭐⭐⭐⭐⭐</span>
            </a>

            <a
              href={`/feedback?rating=4&business=${business.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
            >
              <span className="font-medium">{t.veryGood}</span>
              <span className="text-lg">⭐⭐⭐⭐</span>
            </a>

            <a
              href={`/feedback?rating=3&business=${business.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
            >
              <span className="font-medium">{t.good}</span>
              <span className="text-lg">⭐⭐⭐</span>
            </a>

            <a
              href={`/feedback?rating=2&business=${business.id}`}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:border-neutral-300 hover:bg-neutral-50 active:scale-[0.99]"
            >
              <span className="font-medium">{t.improve}</span>
              <span className="text-lg">⭐⭐</span>
            </a>
          </div>
        </div>

        {/* ENLACES */}
        {(business.google_url ||
          business.instagram_url ||
          business.whatsapp) && (
          <div className="mt-6 space-y-3">
            {business.google_url && (
              <a
                href={business.google_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl bg-black px-5 py-4 text-center text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
              >
                ⭐ {t.google}
              </a>
            )}

            {business.instagram_url && (
              <a
                href={business.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-center text-sm font-medium transition hover:bg-neutral-50 active:scale-[0.99]"
              >
                Instagram
              </a>
            )}

            {business.whatsapp && (
              <a
                href={business.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-center text-sm font-medium transition hover:bg-neutral-50 active:scale-[0.99]"
              >
                WhatsApp
              </a>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-auto pt-10 text-center">
          <p className="text-xs text-neutral-400">
            Powered by GuestTap
          </p>
        </div>
      </section>
    </main>
  );
}