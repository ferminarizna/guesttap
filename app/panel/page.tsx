"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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
          feedback.reduce((total, item) => total + item.rating, 0) /
          feedback.length
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-5 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-neutral-500">
            Cargando tu panel...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold">
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

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <div className="mx-auto max-w-6xl px-5 py-8">

        {/* HEADER */}

        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-14 w-14 rounded-2xl object-cover ring-1 ring-black/5"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                GuestTap
              </p>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                {business.name}
              </h1>
            </div>
          </div>

          <a
            href={`/${business.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl bg-black px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Ver mi página
          </a>
        </header>

        {/* NAVEGACIÓN */}

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
          <a
            href="/panel"
            className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
          >
            Resumen
          </a>

          <a
            href="/panel/feedback"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            Feedback
          </a>

          <a
            href="/panel/qr"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            Mi QR
          </a>

          <a
            href="/panel/configuracion"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            Configuración
          </a>
        </nav>

        {/* RESUMEN */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-neutral-500">
              Promedio
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {promedio}
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              sobre 5 estrellas
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-neutral-500">
              Valoraciones
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {feedback.length}
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              recibidas
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-neutral-500">
              Valoraciones positivas
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {positivas}%
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              4 y 5 estrellas
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-neutral-500">
              Feedback privado
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {feedbackPrivado}
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              comentarios recibidos
            </p>
          </div>

        </section>

        {/* VALORACIONES */}

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">

          <div>
            <h2 className="text-lg font-semibold">
              Últimas valoraciones
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Actividad de tus clientes.
            </p>
          </div>

          {feedback.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-neutral-50 p-6 text-center">
              <p className="text-sm text-neutral-500">
                Todavía no recibiste valoraciones.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-neutral-100">
              {feedback.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-lg">
                      {"★".repeat(item.rating)}

                      <span className="text-neutral-200">
                        {"★".repeat(5 - item.rating)}
                      </span>
                    </div>

                    {item.message && (
                      <p className="mt-2 text-sm leading-6 text-neutral-600">
                        {item.message}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-neutral-400">
                    {new Date(item.created_at).toLocaleDateString(
                      "es-AR"
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}

        </section>

      </div>
    </main>
  );
}