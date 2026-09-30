"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditarNegocio({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const router = useRouter();

  const [businessId, setBusinessId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    async function cargarNegocio() {
      const { businessId: id } = await params;
      const numericId = Number(id);

      setBusinessId(numericId);

      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id, name, google_url, instagram_url, whatsapp, logo_url"
        )
        .eq("id", numericId)
        .single();

      if (error || !data) {
        alert("No se pudo cargar el negocio.");
        router.push("/admin");
        return;
      }

      setName(data.name || "");
      setGoogleUrl(data.google_url || "");
      setInstagramUrl(data.instagram_url || "");
      setWhatsapp(data.whatsapp || "");
      setLogoUrl(data.logo_url || "");

      setLoading(false);
    }

    cargarNegocio();
  }, [params, router]);

  async function guardarCambios() {
    if (!businessId) return;

    setSaving(true);

    const { error } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        google_url: googleUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        whatsapp: whatsapp.trim() || null,
        logo_url: logoUrl.trim() || null,
      })
      .eq("id", businessId);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("No se pudieron guardar los cambios.");
      return;
    }

    alert("Negocio actualizado correctamente.");
    router.push("/admin");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 p-6 text-neutral-900">
        <p className="text-sm text-neutral-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-900">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin")}
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            ← Volver
          </button>

          <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
            Editar negocio
          </h1>

          <p className="mt-1 text-sm text-neutral-600">
            Modificá la información que verá el cliente.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Nombre del negocio
            </label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="Nombre del negocio"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Link directo de reseñas de Google
            </label>

            <input
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="Pegá acá el enlace de reseñas de Google"
            />

            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Pegá el enlace que Google genera en “Conseguir más reseñas”.
              No necesitamos acceso a la cuenta de Google del negocio.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Instagram
            </label>

            <input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              WhatsApp
            </label>

            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="https://wa.me/..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              URL del logo
            </label>

            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="https://..."
            />
          </div>

          <button
            onClick={guardarCambios}
            disabled={saving}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </main>
  );
}