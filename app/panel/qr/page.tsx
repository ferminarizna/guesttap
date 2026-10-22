"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: number;
  name: string;
  slug: string;
};

type Stats = {
  scans: number;
  ratings: number;
};

const PRODUCTION_URL = "https://guesttap-five.vercel.app";

function Icon({
  name,
  size = 20,
}: {
  name:
    | "arrow"
    | "external"
    | "download"
    | "check"
    | "copy"
    | "scan"
    | "star"
    | "nfc"
    | "link";
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

  if (name === "external") {
    return (
      <svg {...common}>
        <path d="M14 3h7v7" />
        <path d="M10 14 21 3" />
        <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
      </svg>
    );
  }

  if (name === "download") {
    return (
      <svg {...common}>
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M4 21h16" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "copy") {
    return (
      <svg {...common}>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
      </svg>
    );
  }

  if (name === "scan") {
    return (
      <svg {...common}>
        <path d="M7 3H5a2 2 0 0 0-2 2v2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <path d="M7 7h10v10H7z" />
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

  if (name === "nfc") {
    return (
      <svg {...common}>
        <path d="M8 8.5a5 5 0 0 1 8 0" />
        <path d="M6 6a8 8 0 0 1 12 0" />
        <path d="M10 11a2.5 2.5 0 0 1 4 0" />
        <path d="M12 14v7" />
      </svg>
    );
  }

  if (name === "link") {
    return (
      <svg {...common}>
        <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
        <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1" />
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

export default function ClientQRPage() {
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [qr, setQr] = useState("");

  const [stats, setStats] = useState<Stats>({
    scans: 0,
    ratings: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    cargarQR();
  }, []);

  async function cargarQR() {
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

    const {
      data: businessUser,
      error: businessUserError,
    } = await supabase
      .from("business_users")
      .select("business_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (businessUserError || !businessUser) {
      console.error(businessUserError);
      setError(
        "No encontramos un negocio asociado a tu cuenta."
      );
      setLoading(false);
      return;
    }

    const {
      data: businessData,
      error: businessError,
    } = await supabase
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

    const url = `${PRODUCTION_URL}/go/${businessData.slug}`;

    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 900,
        margin: 2,
        errorCorrectionLevel: "H",
      });

      setBusiness(businessData);
      setQr(qrDataUrl);
    } catch (qrError) {
      console.error(qrError);
      setError("No pudimos generar el QR.");
      setLoading(false);
      return;
    }

    const [
      scansResult,
      ratingsResult,
    ] = await Promise.all([
      supabase
        .from("scan_events")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "business_id",
          businessData.id
        ),

      supabase
        .from("feedback")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "business_id",
          businessData.id
        ),
    ]);

    setStats({
      scans: scansResult.count || 0,
      ratings: ratingsResult.count || 0,
    });

    setLoading(false);
  }

  function descargarQR() {
    if (!qr || !business) return;

    const link = document.createElement("a");

    link.href = qr;
    link.download = `guesttap-${business.slug}.png`;
    link.click();
  }

  async function copiarEnlace() {
    if (!business) return;

    const publicUrl =
      `${PRODUCTION_URL}/go/${business.slug}`;

    try {
      await navigator.clipboard.writeText(
        publicUrl
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] px-4 py-5 sm:p-8">
        <div className="mx-auto max-w-[1120px]">
          <div className="animate-pulse">
            <div className="h-10 w-40 rounded-xl bg-neutral-200" />

            <div className="mx-auto mt-8 max-w-5xl rounded-[28px] bg-white p-6 sm:p-10">
              <div className="h-7 w-52 rounded bg-neutral-200" />

              <div className="mt-3 h-4 w-72 rounded bg-neutral-100" />

              <div className="mt-8 h-80 rounded-3xl bg-neutral-100" />

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="h-24 rounded-2xl bg-neutral-100" />
                <div className="h-24 rounded-2xl bg-neutral-100" />
                <div className="h-24 rounded-2xl bg-neutral-100" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f4] px-5">
        <div className="w-full max-w-md rounded-[28px] border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#173F53] text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold text-neutral-950">
            No pudimos cargar tus puntos de contacto
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error}
          </p>

          <a
            href="/panel"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#173F53] px-5 py-3 text-sm font-semibold text-white"
          >
            Volver al panel
            <Icon name="arrow" size={15} />
          </a>
        </div>
      </main>
    );
  }

  if (!business || !qr) {
    return null;
  }

  const publicUrl =
    `${PRODUCTION_URL}/go/${business.slug}`;

  const conversion =
    stats.scans > 0
      ? Math.round(
          (stats.ratings / stats.scans) * 100
        )
      : 0;

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#183B4E]">

      {/* HEADER */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between px-4 py-4 sm:px-7 sm:py-5 lg:px-8">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[10px]">
              GuestTap
            </p>

            <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
              Puntos de contacto
            </h1>
          </div>

          <a
            href="/panel"
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:px-4"
          >
            <span className="hidden sm:inline">
              Volver al panel
            </span>

            <span className="sm:hidden">
              Volver
            </span>

            <Icon name="arrow" size={14} />
          </a>
        </div>
      </header>

      {/* CONTENIDO */}

      <div className="px-4 py-6 sm:px-7 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-[1120px]">

          {/* INTRO */}

          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Experiencia GuestTap
            </p>

            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Conectá tu negocio.
                </h2>

                <p className="mt-3 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                  Usá QR o NFC para llevar a tus clientes
                  directamente a tu experiencia GuestTap.
                  Cada interacción queda registrada para
                  medir cómo funciona el sistema.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start rounded-full border border-[#D6E5DF] bg-[#F2F8F5] px-3.5 py-2 text-[10px] font-semibold text-[#47707E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#25B7A4]" />
                Punto activo
              </div>
            </div>
          </section>

          {/* STATS */}

          <section className="mt-6 grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-[20px] border border-neutral-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  Escaneos
                </p>

                <div className="hidden h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 sm:flex">
                  <Icon name="scan" size={14} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {stats.scans}
              </p>

              <p className="mt-1 text-[9px] leading-4 text-neutral-400 sm:text-xs">
                interacciones registradas
              </p>
            </div>

            <div className="rounded-[20px] border border-neutral-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  Valoraciones
                </p>

                <div className="hidden h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 sm:flex">
                  <Icon name="star" size={14} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {stats.ratings}
              </p>

              <p className="mt-1 text-[9px] leading-4 text-neutral-400 sm:text-xs">
                respuestas recibidas
              </p>
            </div>

            <div className="rounded-[20px] border border-neutral-200 bg-white p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  Conversión
                </p>

                <div className="hidden h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 sm:flex">
                  <Icon name="link" size={14} />
                </div>
              </div>

              <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {conversion}%
              </p>

              <p className="mt-1 text-[9px] leading-4 text-neutral-400 sm:text-xs">
                scan → valoración
              </p>
            </div>
          </section>

          {/* QR + INFO */}

          <section className="mt-5 overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.035)]">
            <div className="grid lg:grid-cols-[1fr_0.82fr]">

              {/* QR */}

              <div className="flex flex-col items-center justify-center border-b border-neutral-200 px-5 py-7 sm:px-8 sm:py-9 lg:border-b-0 lg:border-r">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#25B7A4]" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                    QR activo
                  </p>
                </div>

                <div className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">
                  <img
                    src={qr}
                    alt={`Código QR de ${business.name}`}
                    className="h-[250px] w-[250px] sm:h-[330px] sm:w-[330px]"
                  />
                </div>

                <p className="mt-5 text-center text-xs text-neutral-400">
                  Escanealo para probar la experiencia.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-[#F3F6F4] px-3 py-1.5 text-[9px] font-semibold text-[#53656C]">
                    Seguimiento activo
                  </span>

                  <span className="rounded-full bg-[#F3F6F4] px-3 py-1.5 text-[9px] font-semibold text-[#53656C]">
                    Analytics conectado
                  </span>
                </div>
              </div>

              {/* DESTINO */}

              <div className="flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9">

                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                  Destino
                </p>

                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  {business.name}
                </h3>

                <p className="mt-2 text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                  Este punto lleva a tus clientes a la
                  experiencia pública de GuestTap y registra
                  la interacción.
                </p>

                {/* LINK */}

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      Enlace del punto
                    </p>

                    <button
                      type="button"
                      onClick={copiarEnlace}
                      className="flex items-center gap-1.5 text-[10px] font-semibold text-neutral-500 transition hover:text-neutral-950"
                    >
                      {copied ? (
                        <>
                          <Icon name="check" size={12} />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Icon name="copy" size={12} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3">
                    <p className="break-all text-[11px] leading-5 text-neutral-600">
                      {publicUrl}
                    </p>
                  </div>
                </div>

                {/* ACTIONS */}

                <div className="mt-5 space-y-2.5">
                  <button
                    type="button"
                    onClick={descargarQR}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#173F53] px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-[#214F65] sm:text-sm"
                  >
                    <Icon name="download" size={16} />
                    Descargar QR
                  </button>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3.5 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 sm:text-sm"
                  >
                    Ver experiencia pública
                    <Icon name="external" size={15} />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* NFC */}

          <section className="mt-5 overflow-hidden rounded-[26px] border border-[#CFE2DE] bg-[#F1F9F7]">
            <div className="grid lg:grid-cols-[auto_1fr]">

              <div className="flex items-center justify-center px-6 py-7 sm:px-8 lg:w-[190px] lg:border-r lg:border-[#D5E7E3]">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#173F53] text-white">
                  <Icon name="nfc" size={29} />
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#47707E]">
                      También compatible con NFC
                    </p>

                    <h3 className="mt-1.5 text-xl font-bold tracking-tight text-[#173F53]">
                      Un toque y listo.
                    </h3>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-[#607781] sm:text-sm sm:leading-6">
                      Podés programar una etiqueta NFC con
                      exactamente el mismo enlace de este punto.
                      El cliente acerca su teléfono y entra a
                      GuestTap sin necesidad de escanear un QR.
                    </p>
                  </div>

                  <div className="shrink-0 rounded-full border border-[#CFE2DE] bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#47707E]">
                    NFC ready
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-2xl border border-[#D5E7E3] bg-white p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8A969B]">
                      01
                    </p>

                    <p className="mt-2 text-xs font-semibold text-[#173F53]">
                      Conseguí una etiqueta NFC
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[#718087]">
                      Una etiqueta NFC estándar sirve.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#D5E7E3] bg-white p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8A969B]">
                      02
                    </p>

                    <p className="mt-2 text-xs font-semibold text-[#173F53]">
                      Programá este enlace
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[#718087]">
                      Usá el enlace de este punto de contacto.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#D5E7E3] bg-white p-4">
                    <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8A969B]">
                      03
                    </p>

                    <p className="mt-2 text-xs font-semibold text-[#173F53]">
                      Colocala en tu negocio
                    </p>

                    <p className="mt-1 text-[10px] leading-4 text-[#718087]">
                      Mesas, mostradores, habitaciones o cajas.
                    </p>
                  </div>

                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-[#D5E7E3] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A969B]">
                      Enlace NFC
                    </p>

                    <p className="mt-1 break-all text-[11px] font-medium text-[#53656C]">
                      {publicUrl}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copiarEnlace}
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#173F53] px-4 py-3 text-[10px] font-semibold text-white transition hover:bg-[#214F65]"
                  >
                    {copied ? (
                      <>
                        <Icon name="check" size={13} />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Icon name="copy" size={13} />
                        Copiar enlace NFC
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* USOS */}

          <section className="mt-5 rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F4F3] text-[#53656C]">
                <Icon name="link" size={17} />
              </div>

              <div>
                <p className="text-xs font-semibold sm:text-sm">
                  Un punto puede estar donde tenga sentido para tu negocio.
                </p>

                <p className="mt-1 text-[10px] leading-5 text-neutral-500 sm:text-xs">
                  Usalo en mesas, mostradores, habitaciones,
                  cartelería, packaging, recepción o cualquier
                  otro lugar donde quieras capturar experiencia.
                </p>
              </div>
            </div>
          </section>

          <footer className="py-8 text-center">
            <p className="text-[9px] text-neutral-400 sm:text-[10px]">
              GuestTap · Customer Experience Intelligence
            </p>
          </footer>

        </div>
      </div>
    </main>
  );
}