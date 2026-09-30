"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditarNegocioPage() {
  const params = useParams();
  const router = useRouter();

  const businessId = Number(params.businessId);

  const [nombre, setNombre] = useState("");
  const [google, setGoogle] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargarNegocio() {
      if (!businessId) return;

      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, google_url, instagram_url, whatsapp")
        .eq("id", businessId)
        .single();

      if (error) {
        console.error(error);
        alert("No se pudo cargar el negocio.");
        router.push("/admin");
        return;
      }

      setNombre(data.name || "");
      setGoogle(data.google_url || "");
      setInstagram(data.instagram_url || "");
      setWhatsapp(data.whatsapp || "");

      setLoading(false);
    }

    cargarNegocio();
  }, [businessId, router]);

  async function guardarCambios() {
    if (!nombre.trim()) return;

    setGuardando(true);

    const { error } = await supabase
      .from("businesses")
      .update({
        name: nombre,
        google_url: google || null,
        instagram_url: instagram || null,
        whatsapp: whatsapp || null,
      })
      .eq("id", businessId);

    if (error) {
      console.error(error);
      alert(`No se pudieron guardar los cambios.\n\n${error.message}`);
      setGuardando(false);
      return;
    }

    alert("Cambios guardados correctamente.");
    router.push("/admin");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-500">
          Cargando negocio...
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

        <h1 className="text-3xl font-semibold">
          Editar negocio
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Modificá los datos del establecimiento.
        </p>

        <div className="mt-8 space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre del negocio
            </label>

            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Google Maps
            </label>

            <input
              value={google}
              onChange={(e) => setGoogle(e.target.value)}
              placeholder="Pegá el enlace de Google Maps"
              className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Instagram
            </label>

            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              WhatsApp
            </label>

            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="https://wa.me/..."
              className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <button
            onClick={guardarCambios}
            disabled={!nombre.trim() || guardando}
            className="w-full rounded-xl bg-black py-4 font-medium text-white disabled:opacity-40"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>

        </div>
      </div>
    </main>
  );
}