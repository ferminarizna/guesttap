"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import { supabase } from "../../../../lib/supabase";

export default function QRPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = Number(params.businessId);

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarNegocio() {
      if (!businessId) return;

      const { data, error } = await supabase
        .from("businesses")
        .select("name, slug")
        .eq("id", businessId)
        .single();

      if (error) {
        console.error(error);
        alert("No se pudo cargar el negocio.");
        router.push("/admin");
        return;
      }

      setBusinessName(data.name);
      setSlug(data.slug);

      const url = `${window.location.origin}/${data.slug}`;

      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 800,
        margin: 2,
      });

      setQr(qrDataUrl);
      setLoading(false);
    }

    cargarNegocio();
  }, [businessId, router]);

  function descargarQR() {
    const link = document.createElement("a");
    link.href = qr;
    link.download = `${slug}-qr.png`;
    link.click();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">
          Generando QR...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-900">
      <div className="mx-auto max-w-xl">

        <button
          onClick={() => router.push("/admin")}
          className="mb-6 text-sm font-medium text-neutral-500 hover:text-black"
        >
          ← Volver al dashboard
        </button>

        <div className="text-center">
          <h1 className="text-3xl font-semibold">
            QR de {businessName}
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Este QR lleva directamente a la página del negocio.
          </p>
        </div>

        <div className="mt-8 rounded-3xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">

          <div className="flex justify-center">
            <img
              src={qr}
              alt={`QR de ${businessName}`}
              className="h-80 w-80"
            />
          </div>

          <p className="mt-6 break-all text-center text-sm text-neutral-500">
            {window.location.origin}/{slug}
          </p>

          <button
            onClick={descargarQR}
            className="mt-6 w-full rounded-xl bg-black py-4 font-medium text-white hover:bg-neutral-800"
          >
            Descargar QR
          </button>

        </div>
      </div>
    </main>
  );
}