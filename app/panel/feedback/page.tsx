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
          feedback.reduce((total, item) => total + item.rating, 0) /
          feedback.length
        ).toFixed(1)
      : "0.0";

  const privados = feedback.filter(
    (item) => item.message && item.message.trim() !== ""
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-neutral-500">
            Cargando feedback...
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
            No pudimos cargar el feedback
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error}
          </p>

          <a
            href="/panel"
            className="mt-6 inline-flex rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Volver al panel
          </a>
        </div>
      </main>
    );
  }

  if (!business) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 py-8">
      <div className="mx-auto max-w-5xl">

        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              GuestTap
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              Feedback
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Comentarios recibidos de los clientes de {business.name}.
            </p>
          </div>

          <a
            href="/panel"
            className="rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-center text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Volver al resumen
          </a>
        </header>

        <nav className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5">
          <a
            href="/panel"
            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            Resumen
          </a>

          <a
            href="/panel/feedback"
            className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white"
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

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-neutral-500">
              Valoraciones
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {feedback.length}
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              totales
            </p>
          </div>

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
              Feedback privado
            </p>

            <p className="mt-3 text-4xl font-semibold tracking-tight">
              {privados.length}
            </p>

            <p className="mt-2 text-sm text-neutral-400">
              comentarios
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div>
            <h2 className="text-lg font-semibold">
              Comentarios de clientes
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Acá aparecen los comentarios privados enviados desde GuestTap.
            </p>
          </div>

          {privados.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-neutral-50 p-8 text-center">
              <div className="text-3xl">
                💬
              </div>

              <p className="mt-4 text-sm font-medium text-neutral-700">
                Todavía no hay comentarios privados.
              </p>

              <p className="mt-2 text-sm leading-6 text-neutral-400">
                Cuando un cliente deje un comentario, aparecerá acá.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-neutral-100">
              {privados.map((item) => (
                <article
                  key={item.id}
                  className="py-6 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-lg">
                        {"★".repeat(item.rating)}

                        <span className="text-neutral-200">
                          {"★".repeat(5 - item.rating)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-7 text-neutral-700">
                        {item.message}
                      </p>
                    </div>

                    <p className="shrink-0 text-xs text-neutral-400">
                      {new Date(item.created_at).toLocaleDateString(
                        "es-AR"
                      )}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}