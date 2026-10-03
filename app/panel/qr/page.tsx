"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: number;
  name: string;
  slug: string;
};

const PRODUCTION_URL = "https://guesttap-five.vercel.app";

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "external" | "download" | "check" | "copy";
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

  return (
    <svg {...common}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export default function ClientQRPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [qr, setQr] = useState("");
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

    const url = `${PRODUCTION_URL}/${businessData.slug}`;

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
    }

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

    const publicUrl = `${PRODUCTION_URL}/${business.slug}`;

    try {
      await navigator.clipboard.writeText(publicUrl);
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
        <div className="mx-auto max-w-[1100px]">
          <div className="animate-pulse">
            <div className="h-10 w-40 rounded-xl bg-neutral-200" />

            <div className="mx-auto mt-8 max-w-3xl rounded-[28px] bg-white p-6 sm:p-10">
              <div className="mx-auto h-7 w-52 rounded bg-neutral-200" />
              <div className="mx-auto mt-3 h-4 w-72 rounded bg-neutral-100" />
              <div className="mx-auto mt-8 h-72 w-72 rounded-3xl bg-neutral-100 sm:h-80 sm:w-80" />
              <div className="mt-8 h-12 rounded-xl bg-neutral-100" />
              <div className="mt-3 h-12 rounded-xl bg-neutral-200" />
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
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-xl font-bold text-white">
            G
          </div>

          <h1 className="mt-6 text-xl font-semibold text-neutral-950">
            No pudimos cargar tu QR
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error}
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

  if (!business || !qr) {
    return null;
  }

  const publicUrl = `${PRODUCTION_URL}/${business.slug}`;

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-neutral-950">

      {/* HEADER */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-4 sm:px-7 sm:py-5 lg:px-8">

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[10px]">
              GuestTap
            </p>

            <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
              Mi QR
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

        <div className="mx-auto max-w-[1000px]">

          {/* INTRO */}

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              Tu GuestTap
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              Tu código QR
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
              Tus clientes pueden escanear este código para acceder directamente a la página de {business.name}.
            </p>

          </div>

          {/* QR CARD */}

          <section className="mx-auto mt-7 max-w-3xl overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] sm:mt-9">

            <div className="grid lg:grid-cols-[1fr_0.8fr]">

              {/* QR */}

              <div className="flex flex-col items-center justify-center border-b border-neutral-200 px-5 py-7 sm:px-8 sm:py-9 lg:border-b-0 lg:border-r">

                <div className="flex items-center gap-2">

                  <span className="h-2 w-2 rounded-full bg-green-500" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                    QR activo
                  </p>

                </div>

                <div className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-3 shadow-sm sm:p-4">

                  <img
                    src={qr}
                    alt={`Código QR de ${business.name}`}
                    className="h-[250px] w-[250px] sm:h-[320px] sm:w-[320px]"
                  />

                </div>

                <p className="mt-5 text-center text-xs text-neutral-400">
                  Escaneá el código para probarlo.
                </p>

              </div>

              {/* INFO */}

              <div className="flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9">

                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                  Destino
                </p>

                <h3 className="mt-2 text-xl font-semibold tracking-tight">
                  {business.name}
                </h3>

                <p className="mt-2 text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
                  Este QR está conectado a tu página pública de GuestTap.
                </p>

                {/* URL */}

                <div className="mt-6">

                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                      Enlace
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-black px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-neutral-800 sm:text-sm"
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
                    Ver página pública
                    <Icon name="external" size={15} />
                  </a>

                </div>

              </div>

            </div>

          </section>

          {/* INFO EXTRA */}

          <section className="mx-auto mt-4 max-w-3xl rounded-[22px] border border-neutral-200 bg-white px-5 py-5 sm:px-6">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                <Icon name="check" size={16} />
              </div>

              <div>
                <p className="text-xs font-semibold sm:text-sm">
                  Podés usar este QR donde quieras
                </p>

                <p className="mt-1 text-[10px] leading-5 text-neutral-500 sm:text-xs">
                  Imprimilo, colocálo en mesas, mostradores, habitaciones, cartelería o cualquier otro punto de contacto con tus clientes.
                </p>
              </div>

            </div>

          </section>

          <footer className="py-8 text-center">
            <p className="text-[9px] text-neutral-400 sm:text-[10px]">
              GuestTap · Herramientas para tu negocio
            </p>
          </footer>

        </div>

      </div>

    </main>
  );
}