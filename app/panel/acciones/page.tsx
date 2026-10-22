"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Business = {
  id: number;
  name: string;
  slug: string;
};

type ActionStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "dismissed";

type ActionPriority =
  | "low"
  | "medium"
  | "high";

type Action = {
  id: number;
  business_id: number;
  title: string;
  description: string | null;
  source_type: string | null;
  source_key: string | null;
  status: ActionStatus;
  priority: ActionPriority;
  created_at: string;
  started_at: string | null;
  resolved_at: string | null;
};

function Icon({
  name,
  size = 18,
}: {
  name:
    | "arrow"
    | "check"
    | "play"
    | "x"
    | "activity";
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

  if (name === "check") {
    return (
      <svg {...common}>
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (name === "play") {
    return (
      <svg {...common}>
        <path d="m9 7 8 5-8 5V7Z" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg {...common}>
        <path d="m7 7 10 10" />
        <path d="m17 7-10 10" />
      </svg>
    );
  }

  if (name === "activity") {
    return (
      <svg {...common}>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: ActionStatus) {
  if (status === "pending") return "Pendiente";
  if (status === "in_progress") return "En progreso";
  if (status === "resolved") return "Resuelta";
  return "Descartada";
}

function priorityLabel(priority: ActionPriority) {
  if (priority === "high") return "Alta";
  if (priority === "medium") return "Media";
  return "Baja";
}

function StatusBadge({
  status,
}: {
  status: ActionStatus;
}) {
  const styles: Record<ActionStatus, string> = {
    pending: "bg-[#FFF4DF] text-[#9A6A17]",
    in_progress: "bg-[#EAF1F5] text-[#315B70]",
    resolved: "bg-[#E8F6F2] text-[#187766]",
    dismissed: "bg-neutral-100 text-neutral-400",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: ActionPriority;
}) {
  const styles: Record<ActionPriority, string> = {
    high: "text-[#C45F4D]",
    medium: "text-[#9A6A17]",
    low: "text-neutral-400",
  };

  return (
    <span
      className={`text-[9px] font-bold uppercase tracking-[0.1em] ${styles[priority]}`}
    >
      Prioridad {priorityLabel(priority)}
    </span>
  );
}

export default function AccionesPage() {
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [actions, setActions] = useState<Action[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [filter, setFilter] = useState<
    "active" | "all" | "resolved"
  >("active");

  useEffect(() => {
    cargarAcciones();
  }, []);

  async function cargarAcciones() {
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

    setBusiness(businessData);

    const {
      data: actionData,
      error: actionError,
    } = await supabase
      .from("improvement_actions")
      .select(
        "id, business_id, title, description, source_type, source_key, status, priority, created_at, started_at, resolved_at"
      )
      .eq("business_id", businessData.id)
      .order("created_at", {
        ascending: false,
      });

    if (actionError) {
      console.error(actionError);
      setError("No pudimos cargar las acciones.");
      setLoading(false);
      return;
    }

    setActions(actionData || []);
    setLoading(false);
  }

  async function actualizarEstado(
    action: Action,
    nextStatus: ActionStatus
  ) {
    setUpdatingId(action.id);
    setError("");

    const updateData: {
      status: ActionStatus;
      started_at?: string;
      resolved_at?: string;
    } = {
      status: nextStatus,
    };

    if (
      nextStatus === "in_progress" &&
      !action.started_at
    ) {
      updateData.started_at =
        new Date().toISOString();
    }

    if (nextStatus === "resolved") {
      updateData.resolved_at =
        new Date().toISOString();
    }

    const {
      data,
      error: updateError,
    } = await supabase
      .from("improvement_actions")
      .update(updateData)
      .eq("id", action.id)
      .eq("business_id", action.business_id)
      .select(
        "id, business_id, title, description, source_type, source_key, status, priority, created_at, started_at, resolved_at"
      )
      .single();

    if (updateError) {
      console.error(updateError);
      setError(
        "No pudimos actualizar la acción."
      );
      setUpdatingId(null);
      return;
    }

    if (data) {
      setActions((current) =>
        current.map((item) =>
          item.id === action.id
            ? data
            : item
        )
      );
    }

    setUpdatingId(null);
  }

  const activeActions = useMemo(
    () =>
      actions.filter(
        (action) =>
          action.status === "pending" ||
          action.status === "in_progress"
      ),
    [actions]
  );

  const resolvedActions = useMemo(
    () =>
      actions.filter(
        (action) =>
          action.status === "resolved"
      ),
    [actions]
  );

  const visibleActions = useMemo(() => {
    if (filter === "active") {
      return activeActions;
    }

    if (filter === "resolved") {
      return resolvedActions;
    }

    return actions.filter(
      (action) =>
        action.status !== "dismissed"
    );
  }, [
    actions,
    activeActions,
    resolvedActions,
    filter,
  ]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f6f4] px-4 py-7 sm:px-7 sm:py-10">
        <div className="mx-auto max-w-[1100px] animate-pulse">
          <div className="h-10 w-40 rounded-xl bg-neutral-200" />

          <div className="mt-8 h-28 rounded-[24px] bg-neutral-100" />

          <div className="mt-5 h-36 rounded-[24px] bg-neutral-100" />

          <div className="mt-5 h-72 rounded-[24px] bg-neutral-100" />
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
            No pudimos cargar las acciones
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

  if (!business) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f6f6f4] text-[#183B4E]">

      {/* HEADER */}

      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1100px] px-4 sm:px-7 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-neutral-400 sm:text-[10px]">
                GuestTap
              </p>

              <h1 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                Acciones
              </h1>
            </div>

            <a
              href="/panel"
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
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

          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-3">
            <a
              href="/panel"
              className="shrink-0 rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Resumen
            </a>

            <a
              href="/panel/feedback"
              className="shrink-0 rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Feedback
            </a>

            <a
              href="/panel/analytics"
              className="shrink-0 rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Analytics
            </a>

            <a
              href="/panel/acciones"
              className="shrink-0 rounded-xl bg-[#173F53] px-3 py-2.5 text-[11px] font-semibold text-white"
            >
              Acciones
            </a>

            <a
              href="/panel/qr"
              className="shrink-0 rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Mi QR
            </a>

            <a
              href="/panel/configuracion"
              className="shrink-0 rounded-xl px-3 py-2.5 text-[11px] font-medium text-neutral-500 hover:bg-neutral-100"
            >
              Configuración
            </a>
          </nav>
        </div>
      </header>

      {/* CONTENT */}

      <div className="px-4 py-7 sm:px-7 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-[1100px]">

          {/* INTRO */}

          <section>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              {business.name}
            </p>

            <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Convertí señales en acciones.
            </h2>

            <p className="mt-3 max-w-2xl text-xs leading-5 text-neutral-500 sm:text-sm sm:leading-6">
              Cuando GuestTap detecta una señal importante,
              podés convertirla en una acción concreta y
              seguir su evolución hasta resolverla.
            </p>
          </section>

          {/* METRICS */}

          <section className="mt-7 grid gap-3 sm:grid-cols-3">

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                Activas
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {activeActions.length}
              </p>

              <p className="mt-1 text-[10px] text-neutral-400">
                pendientes o en progreso
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                Pendientes
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {
                  activeActions.filter(
                    (action) =>
                      action.status === "pending"
                  ).length
                }
              </p>

              <p className="mt-1 text-[10px] text-neutral-400">
                todavía sin comenzar
              </p>
            </div>

            <div className="rounded-[22px] border border-neutral-200 bg-white p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-neutral-400">
                Resueltas
              </p>

              <p className="mt-3 text-3xl font-semibold tracking-tight">
                {resolvedActions.length}
              </p>

              <p className="mt-1 text-[10px] text-neutral-400">
                acciones completadas
              </p>
            </div>

          </section>

          {/* EXPLANATION */}

          <section className="mt-5 overflow-hidden rounded-[26px] bg-[#173F53] text-white">
            <div className="p-6 sm:p-7">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">
                El ciclo GuestTap
              </p>

              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                Detectar → Entender → Actuar → Medir
              </h3>

              <p className="mt-3 max-w-2xl text-xs leading-5 text-white/55 sm:text-sm sm:leading-6">
                Una acción transforma una señal detectada por
                GuestTap en una intervención concreta que
                después podemos medir.
              </p>
            </div>
          </section>

          {/* ACTIONS HEADER */}

          <section className="mt-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.17em] text-neutral-400">
                  Gestión
                </p>

                <h3 className="mt-1 text-lg font-semibold tracking-tight">
                  Tus acciones
                </h3>
              </div>

              <div className="flex rounded-xl border border-neutral-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() =>
                    setFilter("active")
                  }
                  className={
                    filter === "active"
                      ? "rounded-lg bg-[#173F53] px-3 py-2 text-[10px] font-semibold text-white"
                      : "rounded-lg px-3 py-2 text-[10px] font-medium text-neutral-500"
                  }
                >
                  Activas
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilter("all")
                  }
                  className={
                    filter === "all"
                      ? "rounded-lg bg-[#173F53] px-3 py-2 text-[10px] font-semibold text-white"
                      : "rounded-lg px-3 py-2 text-[10px] font-medium text-neutral-500"
                  }
                >
                  Todas
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilter("resolved")
                  }
                  className={
                    filter === "resolved"
                      ? "rounded-lg bg-[#173F53] px-3 py-2 text-[10px] font-semibold text-white"
                      : "rounded-lg px-3 py-2 text-[10px] font-medium text-neutral-500"
                  }
                >
                  Resueltas
                </button>
              </div>
            </div>
          </section>

          {/* ACTION LIST */}

          <section className="mt-4">

            {visibleActions.length === 0 ? (
              <div className="rounded-[26px] border border-neutral-200 bg-white px-6 py-14 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1F5] text-[#315B70]">
                  <Icon
                    name="activity"
                    size={22}
                  />
                </div>

                <h3 className="mt-5 text-base font-semibold">
                  {filter === "resolved"
                    ? "Todavía no hay acciones resueltas."
                    : "No hay acciones activas."}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-neutral-500">
                  Cuando una señal de GuestTap sea
                  suficientemente importante, podrá
                  convertirse en una acción desde
                  Intelligence.
                </p>

              </div>
            ) : (

              <div className="space-y-3">

                {visibleActions.map((action) => (
                  <article
                    key={action.id}
                    className="rounded-[24px] border border-neutral-200 bg-white p-5 sm:p-6"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                      {/* INFO */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge
                            status={action.status}
                          />

                          <PriorityBadge
                            priority={action.priority}
                          />
                        </div>

                        <h4 className="mt-3 text-lg font-semibold tracking-tight text-[#173F53]">
                          {action.title}
                        </h4>

                        {action.description && (
                          <p className="mt-2 max-w-2xl text-xs leading-6 text-neutral-500 sm:text-sm">
                            {action.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-neutral-400">

                          <span>
                            Creada{" "}
                            {formatDate(
                              action.created_at
                            )}
                          </span>

                          {action.started_at && (
                            <span>
                              Iniciada{" "}
                              {formatDate(
                                action.started_at
                              )}
                            </span>
                          )}

                          {action.resolved_at && (
                            <span>
                              Resuelta{" "}
                              {formatDate(
                                action.resolved_at
                              )}
                            </span>
                          )}

                        </div>

                      </div>

                      {/* BUTTONS */}

                      <div className="flex shrink-0 flex-wrap gap-2">

                        {action.status === "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              actualizarEstado(
                                action,
                                "in_progress"
                              )
                            }
                            disabled={
                              updatingId === action.id
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#173F53] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#214F65] disabled:opacity-50"
                          >
                            <Icon
                              name="play"
                              size={14}
                            />
                            Empezar
                          </button>
                        )}

                        {action.status === "in_progress" && (
                          <button
                            type="button"
                            onClick={() =>
                              actualizarEstado(
                                action,
                                "resolved"
                              )
                            }
                            disabled={
                              updatingId === action.id
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-[#078B78] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#087866] disabled:opacity-50"
                          >
                            <Icon
                              name="check"
                              size={14}
                            />
                            Marcar resuelta
                          </button>
                        )}

                        {action.status !== "resolved" &&
                          action.status !== "dismissed" && (
                            <button
                              type="button"
                              onClick={() =>
                                actualizarEstado(
                                  action,
                                  "dismissed"
                                )
                              }
                              disabled={
                                updatingId === action.id
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50"
                            >
                              <Icon
                                name="x"
                                size={14}
                              />
                              Descartar
                            </button>
                          )}

                      </div>
                    </div>

                    {/* SOURCE */}

                    {action.source_key && (
                      <div className="mt-5 flex items-center gap-2 border-t border-neutral-100 pt-4">

                        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                          Origen
                        </span>

                        <span className="rounded-lg bg-neutral-100 px-2.5 py-1.5 text-[9px] font-medium text-neutral-500">
                          Intelligence ·{" "}
                          {action.source_key}
                        </span>

                      </div>
                    )}

                  </article>
                ))}

              </div>
            )}

          </section>

          <footer className="py-9 text-center">
            <p className="text-[9px] text-neutral-400 sm:text-[10px]">
              GuestTap · Customer Experience Intelligence
            </p>
          </footer>

        </div>
      </div>
    </main>
  );
}