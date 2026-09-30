"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Business = {
  id: number;
  name: string;
  slug: string;
  google_url: string | null;
  instagram_url: string | null;
  whatsapp: string | null;
};

type Feedback = {
  id: number;
  created_at: string;
  message: string | null;
  rating: number;
  business_id: number;
};

type BusinessStats = {
  total: number;
  average: number;
  last30: number;
  previous30: number;
  privateFeedback: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  daily: number[];
};

function crearStats(): BusinessStats {
  return {
    total: 0,
    average: 0,
    last30: 0,
    previous30: 0,
    privateFeedback: 0,
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    },
    daily: Array(30).fill(0),
  };
}

function calcularStats(feedback: Feedback[]): BusinessStats {
  const stats = crearStats();

  const ahora = new Date();

  const hace30Dias = new Date(ahora);
  hace30Dias.setDate(ahora.getDate() - 30);

  const hace60Dias = new Date(ahora);
  hace60Dias.setDate(ahora.getDate() - 60);

  let suma = 0;

  feedback.forEach((item) => {
    const rating = Number(item.rating);
    const fecha = new Date(item.created_at);

    stats.total += 1;
    suma += rating;

    if (rating >= 1 && rating <= 5) {
      stats.distribution[
        rating as keyof typeof stats.distribution
      ] += 1;
    }

    if (item.message && item.message.trim()) {
      stats.privateFeedback += 1;
    }

    if (fecha >= hace30Dias) {
      stats.last30 += 1;

      const diferencia =
        Math.floor(
          (ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)
        );

      const indice = Math.min(29, Math.max(0, 29 - diferencia));

      stats.daily[indice] += 1;
    } else if (fecha >= hace60Dias && fecha < hace30Dias) {
      stats.previous30 += 1;
    }
  });

  if (stats.total > 0) {
    stats.average = suma / stats.total;
  }

  return stats;
}

function calcularCambio(actual: number, anterior: number) {
  if (anterior === 0) {
    return null;
  }

  return ((actual - anterior) / anterior) * 100;
}

function MiniChart({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-24 items-end gap-1">
      {values.map((value, index) => (
        <div
          key={index}
          className="flex-1 rounded-t-md bg-neutral-900 transition-all"
          style={{
            height: `${Math.max(8, (value / max) * 100)}%`,
          }}
          title={`${value} valoración${value === 1 ? "" : "es"}`}
        />
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<Record<number, BusinessStats>>({});
  const [loading, setLoading] = useState(true);

  async function cargarDashboard() {
    setLoading(true);

    const { data: businessesData, error: businessesError } =
      await supabase
        .from("businesses")
        .select("id, name, slug, google_url, instagram_url, whatsapp")
        .order("id", { ascending: true });

    if (businessesError) {
      console.error(businessesError);
      setLoading(false);
      return;
    }

    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedback")
      .select("id, created_at, message, rating, business_id")
      .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error(feedbackError);
      setLoading(false);
      return;
    }

    const nuevosStats: Record<number, BusinessStats> = {};

    (businessesData || []).forEach((business) => {
      const feedbackNegocio = (feedbackData || []).filter(
        (item) => Number(item.business_id) === Number(business.id)
      );

      nuevosStats[business.id] = calcularStats(feedbackNegocio);
    });

    setBusinesses(businessesData || []);
    setStats(nuevosStats);
    setLoading(false);
  }

  useEffect(() => {
    cargarDashboard();
  }, []);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    router.replace("/admin-login");
  }

  const resumen = useMemo(() => {
    const valores = Object.values(stats);

    const total = valores.reduce((sum, item) => sum + item.total, 0);

    const totalFeedback = valores.reduce(
      (sum, item) => sum + item.privateFeedback,
      0
    );

    const ultimos30 = valores.reduce(
      (sum, item) => sum + item.last30,
      0
    );

    const anteriores30 = valores.reduce(
      (sum, item) => sum + item.previous30,
      0
    );

    const sumaPromedios = valores.reduce(
      (sum, item) => sum + item.average * item.total,
      0
    );

    const promedio = total > 0 ? sumaPromedios / total : 0;

    const positivas = valores.reduce(
      (sum, item) =>
        sum + item.distribution[5] + item.distribution[4],
      0
    );

    return {
      total,
      totalFeedback,
      ultimos30,
      anteriores30,
      promedio,
      porcentajePositivo: total > 0 ? (positivas / total) * 100 : 0,
    };
  }, [stats]);

  const cambioGeneral = calcularCambio(
    resumen.ultimos30,
    resumen.anteriores30
  );

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-neutral-950">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {/* HEADER */}
        <header className="flex flex-col gap-6 border-b border-neutral-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                G
              </div>
              <span className="text-sm font-semibold tracking-tight">
                GuestTap
              </span>
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
              Seguimiento de experiencia y feedback de tus negocios.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/crear-negocio"
              className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
            >
              + Nuevo negocio
            </Link>

            <button
              onClick={cerrarSesion}
              className="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {loading ? (
          <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-12 text-center text-sm text-neutral-500 shadow-sm">
            Cargando dashboard...
          </div>
        ) : businesses.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-sm">
            <p className="text-sm text-neutral-500">
              Todavía no hay negocios.
            </p>

            <Link
              href="/admin/crear-negocio"
              className="mt-5 inline-flex rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
            >
              Crear primer negocio
            </Link>
          </div>
        ) : (
          <>
            {/* RESUMEN GENERAL */}
            <section className="mt-8">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Resumen general
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-neutral-500">
                    Valoraciones totales
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {resumen.total}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Todos tus negocios
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-neutral-500">
                    Promedio general
                  </p>

                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-3xl font-semibold tracking-tight">
                      {resumen.total > 0
                        ? resumen.promedio.toFixed(1)
                        : "—"}
                    </p>

                    {resumen.total > 0 && (
                      <span className="text-sm text-neutral-400">
                        / 5
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-neutral-400">
                    ⭐ Promedio de valoraciones
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-neutral-500">
                    Últimos 30 días
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {resumen.ultimos30}
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    {cambioGeneral !== null
                      ? `${cambioGeneral >= 0 ? "+" : ""}${cambioGeneral.toFixed(
                          0
                        )}% vs. período anterior`
                      : "Sin período anterior"}
                  </p>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-neutral-500">
                    Experiencias positivas
                  </p>

                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {Math.round(resumen.porcentajePositivo)}%
                  </p>

                  <p className="mt-1 text-xs text-neutral-400">
                    Valoraciones de 4 y 5 ⭐
                  </p>
                </div>
              </div>
            </section>

            {/* NEGOCIOS */}
            <section className="mt-10">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Negocios
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight">
                    Rendimiento por negocio
                  </h2>
                </div>

                <span className="text-sm text-neutral-400">
                  {businesses.length} negocio
                  {businesses.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="space-y-5">
                {businesses.map((business) => {
                  const businessStats =
                    stats[business.id] || crearStats();

                  const cambio = calcularCambio(
                    businessStats.last30,
                    businessStats.previous30
                  );

                  const total = businessStats.total || 1;

                  const positivas =
                    businessStats.distribution[5] +
                    businessStats.distribution[4];

                  const porcentajePositivo =
                    (positivas / total) * 100;

                  return (
                    <article
                      key={business.id}
                      className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm"
                    >
                      {/* BUSINESS HEADER */}
                      <div className="flex flex-col gap-5 border-b border-neutral-100 p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-sm font-semibold">
                              {business.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold tracking-tight">
                                {business.name}
                              </h3>

                              <p className="mt-0.5 text-xs text-neutral-400">
                                /{business.slug}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/qr/${business.id}`}
                            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-50"
                          >
                            QR
                          </Link>

                          <Link
                            href={`/admin/editar-negocio/${business.id}`}
                            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-50"
                          >
                            Editar
                          </Link>

                          <Link
                            href={`/admin/feedback/${business.id}`}
                            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
                          >
                            Ver feedback
                          </Link>

                          <a
                            href={`/${business.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:bg-neutral-50"
                          >
                            Ver página
                          </a>
                        </div>
                      </div>

                      {/* KEY METRICS */}
                      <div className="grid border-b border-neutral-100 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="p-6 lg:border-r lg:border-neutral-100">
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Promedio
                          </p>

                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-semibold tracking-tight">
                              {businessStats.total > 0
                                ? businessStats.average.toFixed(1)
                                : "—"}
                            </span>

                            {businessStats.total > 0 && (
                              <span className="text-sm text-neutral-400">
                                / 5
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-neutral-400">
                            {businessStats.total} valoraciones
                          </p>
                        </div>

                        <div className="border-t border-neutral-100 p-6 sm:border-t-0 lg:border-r">
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Últimos 30 días
                          </p>

                          <p className="mt-2 text-3xl font-semibold tracking-tight">
                            {businessStats.last30}
                          </p>

                          <p className="mt-1 text-xs text-neutral-400">
                            {cambio !== null
                              ? `${cambio >= 0 ? "+" : ""}${cambio.toFixed(
                                  0
                                )}% vs. período anterior`
                              : "Sin período anterior"}
                          </p>
                        </div>

                        <div className="border-t border-neutral-100 p-6 sm:border-t-0 lg:border-r">
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Feedback privado
                          </p>

                          <p className="mt-2 text-3xl font-semibold tracking-tight">
                            {businessStats.privateFeedback}
                          </p>

                          <p className="mt-1 text-xs text-neutral-400">
                            Comentarios escritos
                          </p>
                        </div>

                        <div className="border-t border-neutral-100 p-6 sm:border-t-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                            Positivas
                          </p>

                          <p className="mt-2 text-3xl font-semibold tracking-tight">
                            {Math.round(porcentajePositivo)}%
                          </p>

                          <p className="mt-1 text-xs text-neutral-400">
                            4 y 5 estrellas
                          </p>
                        </div>
                      </div>

                      {/* LOWER CONTENT */}
                      <div className="grid gap-8 p-6 lg:grid-cols-2">
                        {/* DISTRIBUCIÓN */}
                        <div>
                          <div className="flex items-end justify-between">
                            <div>
                              <h4 className="text-sm font-semibold">
                                Distribución
                              </h4>
                              <p className="mt-1 text-xs text-neutral-400">
                                Todas las valoraciones recibidas
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 space-y-3">
                            {[5, 4, 3, 2, 1].map((rating) => {
                              const cantidad =
                                businessStats.distribution[
                                  rating as keyof typeof businessStats.distribution
                                ];

                              const porcentaje =
                                businessStats.total > 0
                                  ? (cantidad /
                                      businessStats.total) *
                                    100
                                  : 0;

                              return (
                                <div
                                  key={rating}
                                  className="flex items-center gap-3"
                                >
                                  <span className="w-10 text-xs font-medium text-neutral-600">
                                    {rating} ⭐
                                  </span>

                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                                    <div
                                      className="h-full rounded-full bg-neutral-900 transition-all"
                                      style={{
                                        width: `${porcentaje}%`,
                                      }}
                                    />
                                  </div>

                                  <span className="w-8 text-right text-xs font-medium text-neutral-500">
                                    {cantidad}
                                  </span>

                                  <span className="w-10 text-right text-xs text-neutral-400">
                                    {Math.round(porcentaje)}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* ACTIVIDAD */}
                        <div>
                          <div className="flex items-end justify-between">
                            <div>
                              <h4 className="text-sm font-semibold">
                                Actividad
                              </h4>
                              <p className="mt-1 text-xs text-neutral-400">
                                Valoraciones de los últimos 30 días
                              </p>
                            </div>

                            <span className="text-xs text-neutral-400">
                              30 días
                            </span>
                          </div>

                          <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
                            <MiniChart
                              values={businessStats.daily}
                            />

                            <div className="mt-3 flex justify-between text-[10px] text-neutral-400">
                              <span>30 días atrás</span>
                              <span>Hoy</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* FOOTER INFO */}
            <div className="mt-8 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
              GuestTap · Dashboard de experiencia
            </div>
          </>
        )}
      </div>
    </main>
  );
}