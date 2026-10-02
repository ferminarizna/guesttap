"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

type Feedback = {
  id: number;
  created_at: string;
  message: string;
  rating: number;
};

type Business = {
  id: number;
  name: string;
};

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = Number(params.businessId);

  const [business, setBusiness] = useState<Business | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function cargarDatos() {
      if (!businessId) {
        setError("ID de negocio inválido.");
        setLoading(false);
        return;
      }

      try {
        setError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError(
            "La sesión de administrador expiró. Volvé a iniciar sesión."
          );

          setLoading(false);
          router.push("/admin-login");
          return;
        }

        const response = await fetch(
          `/api/admin/feedback/${businessId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          console.error(
            "Error cargando feedback:",
            result
          );

          setError(
            result.error ||
              "No se pudo cargar el feedback."
          );

          setLoading(false);
          return;
        }

        setBusiness(result.business || null);
        setFeedback(result.feedback || []);
      } catch (error) {
        console.error(error);

        setError(
          "Ocurrió un error al cargar el feedback."
        );
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [businessId, router]);

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-900">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => router.push("/admin")}
          className="mb-6 text-sm font-medium text-neutral-500 hover:text-black"
        >
          ← Volver al dashboard
        </button>

        {business && (
          <div>
            <h1 className="text-3xl font-semibold">
              {business.name}
            </h1>

            <p className="mt-2 text-sm text-neutral-500">
              Feedback recibido
            </p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">
              Cargando feedback...
            </div>
          ) : feedback.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500 ring-1 ring-neutral-200">
              Todavía no hay feedback para este negocio.
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-lg">
                      {"⭐".repeat(
                        Math.max(
                          1,
                          Math.min(5, item.rating)
                        )
                      )}
                    </div>

                    <p className="text-xs text-neutral-400">
                      {new Date(
                        item.created_at
                      ).toLocaleDateString("es-AR")}
                    </p>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-neutral-700">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}