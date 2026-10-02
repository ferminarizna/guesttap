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

export default function ClientQRPage() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <p className="text-sm text-neutral-500">
          Generando tu QR...
        </p>
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
            No pudimos cargar tu QR
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!business || !qr) {
    return null;
  }

  const publicUrl = `${PRODUCTION_URL}/${business.slug}`;

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              GuestTap
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Mi QR
            </h1>
          </div>

          <a
            href="/panel"
            className="rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Volver
          </a>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-black/5 sm:p-8">
          <h2 className="text-xl font-semibold">
            {business.name}
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Este QR lleva directamente a tu página de GuestTap.
          </p>

          <div className="mx-auto mt-8 w-fit rounded-3xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <img
              src={qr}
              alt={`QR de ${business.name}`}
              className="h-64 w-64 sm:h-80 sm:w-80"
            />
          </div>

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
              Enlace
            </p>

            <p className="mt-2 break-all rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
              {publicUrl}
            </p>
          </div>

          <button
            onClick={descargarQR}
            className="mt-5 w-full rounded-2xl bg-black px-5 py-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Descargar QR
          </button>
        </section>
      </div>
    </main>
  );
}