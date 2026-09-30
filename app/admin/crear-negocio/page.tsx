"use client";

import { supabase } from "../../../lib/supabase";
import { useState } from "react";

export default function AdminPage() {
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [google, setGoogle] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  function generarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function crearNegocio() {
    if (!nombre.trim()) return;

    const { error } = await supabase
      .from("businesses")
      .insert({
        name: nombre,
        slug: slug,
        google_url: google || null,
        instagram_url: instagram || null,
        whatsapp: whatsapp || null,
      });

if (error) {
  console.error(JSON.stringify(error, null, 2));
  alert(
    `Error: ${error.message}\nCódigo: ${error.code}\nDetalle: ${error.details}`
  );
  return;
}

    alert("Negocio creado correctamente.");

    setNombre("");
    setSlug("");
    setGoogle("");
    setInstagram("");
    setWhatsapp("");
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10 text-neutral-900">
      <div className="mx-auto max-w-xl">

        <h1 className="text-3xl font-semibold">
          Crear negocio
        </h1>

        <p className="mt-2 text-sm text-neutral-500">
          Cargá los datos del establecimiento.
        </p>

        <div className="mt-8 space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre del negocio
            </label>

            <input
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setSlug(generarSlug(e.target.value));
              }}
              placeholder="Ej. Hotel Albatros"
              className="w-full rounded-xl border border-neutral-200 bg-white p-4 outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              URL
            </label>

            <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 text-sm text-neutral-500">
              /{slug || "nombre-del-negocio"}
            </div>
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
            onClick={crearNegocio}
            disabled={!nombre.trim()}
            className="w-full rounded-xl bg-black py-4 font-medium text-white disabled:opacity-40"
          >
            Crear negocio
          </button>

        </div>
      </div>
    </main>
  );
}