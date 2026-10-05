"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: number;
  name: string;
  logo_url: string | null;
};

type ScanEvent = {
  id: number;
  source: string;
  created_at: string;
};

type Feedback = {
  id: number;
  rating: number;
  created_at: string;
};

function Icon({
  name,
  size = 20,
}: {
  name: "activity" | "arrow" | "scan" | "star" | "trend";
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

  if (name === "activity") {
    return (
      <svg {...common}>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </svg>
    );
  }

  if (name === "scan") {
    return (
      <svg {...common}>
        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
        <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
        <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="M8 8h8v8H8z" />
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

  if (name === "trend") {
    return (
      <svg {...common}>
        <path d="M3 17 9 11l4 4 8-9" />
        <path d="M16 6h5v5" />
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
  });
}

export default function AnalyticsPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [scans, setScans] = useState<ScanEvent[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarAnalytics();
  }, []);

  async function cargarAnalytics() {
    setLoading(true);
    setError("");

    try {
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
          .select("id, name, logo_url")
          .eq("id", businessUser.business_id)
          .single();

      if (businessError || !businessData) {
        console.error(businessError);
        setError("No pudimos cargar tu negocio.");
        setLoading(false);
        return;
      }

      const { data: scanData, error: scanError } = await supabase
        .from("scan_events")
        .select("id, source, created_at")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

      if (scanError) {
        console.error(scanError);
        setError("No pudimos cargar los datos de escaneos.");
        setLoading(false);
        return;
      }

      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("id, rating, created_at")
        .eq("business_id", businessData.id)
        .order("created_at", { ascending: false });

      if (feedbackError) {
        console.error(feedbackError);
        setError("No pudimos cargar las valoraciones.");
        setLoading(false);
        return;
      }

      setBusiness(businessData);
      setScans(scanData || []);
      setFeedback(feedbackData || []);
    } catch (error) {
      console.error(error);
      setError("Ocurrió un error al cargar Analytics.");
    } finally {
      setLoading(false);
    }
  }

  const analytics = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const scansToday = scans.filter((scan) => {
      return new Date(scan.created_at) >= today;
    }).length;

    const scans7Days = scans.filter((scan) => {
      return new Date(scan.created_at) >= sevenDaysAgo;
    }).length;

    const scans30Days = scans.filter((scan) => {
      return new Date(scan.created_at) >= thirtyDaysAgo;
    }).length;

    const feedback30Days = feedback.filter((item) => {
      return new Date(item.created_at) >= thirtyDaysAgo;
    }).length;

    const conversion =
      scans30Days > 0
        ? Math.round((feedback30Days / scans30Days) * 100)
        : 0;

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(sevenDaysAgo);
      date.setDate(sevenDaysAgo.getDate() + index);

      const key = getDayKey(date);

      const count = scans.filter((scan) => {
        return getDayKey(new Date(scan.created_at)) === key;
      }).length;

      return {
        key,
        date,
        count,
        label: formatDayLabel(date),
      };
    });

    const maxDailyScans = Math.max(
      ...last7Days.map((item) => item.count),
      1
    );

    const qrScans = scans.filter(
      (scan) => (scan.source || "qr").toLowerCase() === "qr"
    ).length;

    const nfcScans = scans.filter(
      (scan) => (scan.source || "").toLowerCase() === "nfc"
    ).length;

    return {
      scansTotal: scans.length,
      scansToday,
      scans7Days,
      scans30Days,
      feedbackTotal: feedback.length,
      feedback30Days,
      conversion,
      last7Days,
      maxDailyScans,
      qrScans,
      nfcScans,
    };
  }, [scans, feedback]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] p-3 sm:p-5">
        <div className="mx-auto max-w-[1440px]">
          <div className="min-h-[calc(100vh-24px)] overflow-hidden rounded-[28px] border border-neutral-200 bg-white sm:min-h-[calc(100vh-40px)]">
            <div className="animate-pulse p-5 sm:p-8">
              <div className="h-10 w-48 rounded-xl bg-neutral-200" />
              <div className="mt-3 h-4 w-72 rounded bg-neutral-100" />

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-32 rounded-2xl bg-neutral-100"
                  />
                ))}
              </div>

              <div className="mt-5 h-96 rounded-2xl bg-neutral-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-5">
        <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold">
            No pudimos cargar Analytics
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error || "No encontramos tu negocio."}
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

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-4 sm:px-7 sm:py-5 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-black/10"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-base font-bold text-white">
                {business.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[9px]">
                GuestTap
              </p>

              <h1 className="truncate text-base font-semibold tracking-tight sm:text-xl">
                Analytics
              </h1>
            </div>
          </div>

          <a
            href="/panel"
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:px-4"
          >
            <span className="hidden sm:inline">Volver al panel</span>
            <span className="sm:hidden">Volver</span>
            <Icon name="arrow" size={14} />
          </a>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-7 sm:py-9 lg:px-8">
        <div className="mx-auto max-w-[1100px]">
          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              {business.name}
            </p>

            <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.04em] sm:text-4xl">
              Analytics
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
              Entendé cómo interactúan tus clientes con tu GuestTap y cómo
              evoluciona su respuesta.
            </p>
          </section>

          <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="scan" size={17} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Total
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {formatNumber(analytics.scansTotal)}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                escaneos registrados
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="activity" size={17} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Hoy
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {formatNumber(analytics.scansToday)}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                accesos durante hoy
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="trend" size={17} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  30 días
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {formatNumber(analytics.scans30Days)}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                escaneos en el período
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                  <Icon name="star" size={17} />
                </div>

                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                  Conversión
                </span>
              </div>

              <p className="mt-6 text-3xl font-semibold tracking-tight">
                {analytics.conversion}%
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                escaneo → valoración
              </p>
            </div>
          </section>

          <section className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_0.75fr]">
            <div className="rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                    Actividad
                  </p>

                  <h3 className="mt-1 text-lg font-semibold tracking-tight">
                    Escaneos últimos 7 días
                  </h3>
                </div>

                <div className="hidden rounded-xl bg-neutral-100 px-3 py-2 text-right sm:block">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    Período
                  </p>
                  <p className="mt-0.5 text-xs font-semibold">
                    {formatNumber(analytics.scans7Days)} escaneos
                  </p>
                </div>
              </div>

              <div className="mt-8 flex h-64 items-end gap-2 sm:gap-4">
                {analytics.last7Days.map((day) => {
                  const height =
                    day.count === 0
                      ? 4
                      : Math.max(
                          Math.round(
                            (day.count / analytics.maxDailyScans) * 100
                          ),
                          8
                        );

                  return (
                    <div
                      key={day.key}
                      className="flex h-full flex-1 flex-col items-center justify-end"
                    >
                      <div className="mb-2 text-[10px] font-semibold text-neutral-500">
                        {day.count}
                      </div>

                      <div className="flex h-[190px] w-full items-end">
                        <div
                          className="w-full rounded-t-xl bg-black transition-all"
                          style={{ height: `${height}%` }}
                        />
                      </div>

                      <p className="mt-3 text-[9px] font-medium capitalize text-neutral-400 sm:text-[10px]">
                        {day.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                Canales
              </p>

              <h3 className="mt-1 text-lg font-semibold tracking-tight">
                Cómo llegan tus clientes
              </h3>

              <div className="mt-7 space-y-5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">QR</span>
                    <span className="text-sm font-semibold">
                      {formatNumber(analytics.qrScans)}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width:
                          analytics.scansTotal > 0
                            ? `${(analytics.qrScans / analytics.scansTotal) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">NFC</span>
                    <span className="text-sm font-semibold">
                      {formatNumber(analytics.nfcScans)}
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-neutral-500"
                      style={{
                        width:
                          analytics.scansTotal > 0
                            ? `${(analytics.nfcScans / analytics.scansTotal) * 100}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-neutral-100 pt-5">
                <p className="text-xs leading-5 text-neutral-500">
                  NFC aparecerá automáticamente cuando empecemos a registrar
                  interacciones provenientes de etiquetas NFC.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[22px] border border-neutral-200 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Últimos 7 días
              </p>

              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {formatNumber(analytics.scans7Days)}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                interacciones
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Valoraciones
              </p>

              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {formatNumber(analytics.feedbackTotal)}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                respuestas recibidas
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                Últimos 30 días
              </p>

              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {formatNumber(analytics.feedback30Days)}
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                valoraciones recibidas
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}