"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

function generarSlug(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CrearNegocio() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function crearNegocio() {
    if (!name.trim()) {
      alert("Ingresá el nombre del negocio.");
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert(
          "La sesión de administrador expiró. Volvé a iniciar sesión."
        );
        router.push("/admin-login");
        return;
      }

      const response = await fetch(
        "/api/admin/crear-negocio",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            google_url: googleUrl.trim(),
            instagram_url: instagramUrl.trim(),
            whatsapp: whatsapp.trim(),
            logo_url: logoUrl.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error(
          "Error creando negocio:",
          result
        );

        alert(
          result.error ||
            "No se pudo crear el negocio."
        );

        return;
      }

      alert("Negocio creado correctamente.");

      router.push("/admin");
    } catch (error) {
      console.error(
        "Error inesperado creando negocio:",
        error
      );

      alert(
        "Ocurrió un error al crear el negocio. Intentá nuevamente."
      );
    } finally {
      setSaving(false);
    }
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
            Crear negocio
          </h1>

          <p className="mt-1 text-sm text-neutral-600">
            Cargá los datos del establecimiento.
          </p>
        </div>

        <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Nombre del negocio
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="Ej: Ramos Generales El Almacén"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Link directo de reseñas de Google
            </label>

            <input
              value={googleUrl}
              onChange={(e) =>
                setGoogleUrl(e.target.value)
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="Pegá acá el enlace de reseñas de Google"
            />

            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Es el enlace que Google genera en
              “Conseguir más reseñas”.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              Instagram
            </label>

            <input
              value={instagramUrl}
              onChange={(e) =>
                setInstagramUrl(e.target.value)
              }
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
              onChange={(e) =>
                setWhatsapp(e.target.value)
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="Ej: +54 9 2901 64-9560"
            />

            <p className="mt-2 text-xs leading-5 text-neutral-600">
              Podés ingresar solamente el número.
              GuestTap genera automáticamente el
              enlace de WhatsApp.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-800">
              URL del logo
            </label>

            <input
              value={logoUrl}
              onChange={(e) =>
                setLogoUrl(e.target.value)
              }
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-500"
              placeholder="https://..."
            />

            <p className="mt-2 text-xs leading-5 text-neutral-600">
              URL pública de la imagen del logo.
            </p>
          </div>

          <button
            onClick={crearNegocio}
            disabled={saving}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Creando..."
              : "Crear negocio"}
          </button>
        </div>
      </div>
    </main>
  );
}