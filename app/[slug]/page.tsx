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
    subtitle: "Tu opinión nos ayuda a mejorar.",
    excellent: "Excelente",
    veryGood: "Muy bueno",
    good: "Bueno",
    improve: "Puede mejorar",
    google: "Dejar reseña en Google",
  },
  en: {
    question: "How was your experience?",
    subtitle: "Your feedback helps us improve.",
    excellent: "Excellent",
    veryGood: "Very good",
    good: "Good",
    improve: "Could be better",
    google: "Leave a Google review",
  },
  pt: {
    question: "O que você achou?",
    subtitle: "Sua opinião nos ajuda a melhorar.",
    excellent: "Excelente",
    veryGood: "Muito bom",
    good: "Bom",
    improve: "Pode melhorar",
    google: "Deixar avaliação no Google",
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
        <p className="text-sm text-neutral-400">Cargando...</p>
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

        {/* VALORACIÓN */}
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
            <a
              href={`/feedback?rating=5&business=${business.id}`}
              className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 transition active:scale-[0.99] hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                ⭐
              </span>

              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold">
                  {t.excellent}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-400">
                  ⭐⭐⭐⭐⭐
                </span>
              </span>

              <span className="text-neutral-300 transition group-hover:text-neutral-500">
                →
              </span>
            </a>

            <a
              href={`/feedback?rating=4&business=${business.id}`}
              className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 transition active:scale-[0.99] hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                ⭐
              </span>

              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold">
                  {t.veryGood}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-400">
                  ⭐⭐⭐⭐
                </span>
              </span>

              <span className="text-neutral-300 transition group-hover:text-neutral-500">
                →
              </span>
            </a>

            <a
              href={`/feedback?rating=3&business=${business.id}`}
              className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 transition active:scale-[0.99] hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                ⭐
              </span>

              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold">
                  {t.good}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-400">
                  ⭐⭐⭐
                </span>
              </span>

              <span className="text-neutral-300 transition group-hover:text-neutral-500">
                →
              </span>
            </a>

            <a
              href={`/feedback?rating=2&business=${business.id}`}
              className="group flex w-full items-center gap-4 rounded-2xl border border-neutral-200 bg-white px-4 py-4 transition active:scale-[0.99] hover:border-neutral-300 hover:bg-neutral-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-lg">
                ⭐
              </span>

              <span className="flex-1 text-left">
                <span className="block text-sm font-semibold">
                  {t.improve}
                </span>
                <span className="mt-0.5 block text-xs text-neutral-400">
                  ⭐⭐
                </span>
              </span>

              <span className="text-neutral-300 transition group-hover:text-neutral-500">
                →
              </span>
            </a>
          </div>
        </div>

        {/* OTROS CANALES */}
        {(business.google_url ||
          business.instagram_url ||
          business.whatsapp) && (
          <div className="mt-5 space-y-2.5">
            {business.google_url && (
              <a
                href={business.google_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-5 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.99]"
              >
                ⭐ {t.google}
              </a>
            )}

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
        <div className="mt-auto pt-10 pb-2 text-center">
          <p className="text-[11px] font-medium tracking-wide text-neutral-300">
            POWERED BY GUESTTAP
          </p>
        </div>

      </section>
    </main>
  );
}