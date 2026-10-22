"use client";

import {
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../../../lib/supabase";

/* =========================================================
   GUESTTAP ANALYTICS
   ---------------------------------------------------------
   Product principles

   1. Never present an observation as a conclusion.
   2. Never invent patterns from insufficient data.
   3. Every intelligence signal must have evidence.
   4. Every comparison must expose its sample size.
   5. Scans and feedback are different events.
   6. Conversion only uses attributable scan -> feedback pairs.
   7. Empty states explain what is missing.
   8. Color communicates meaning, not decoration.
   ========================================================= */

type Business = {
  id: number;
  name: string;
  logo_url: string | null;
};

type ScanEvent = {
  id: number;
  source: string | null;
  created_at: string;
};

type Feedback = {
  id: number;
  rating: number;
  message: string | null;
  created_at: string;
  scan_event_id: number | null;
};

type PeriodKey = "7" | "30" | "90" | "all";

type CommentFilter =
  | "all"
  | "positive"
  | "critical";

type SignalType =
  | "attention"
  | "strength"
  | "change"
  | "observation";

type SignalConfidence =
  | "high"
  | "medium"
  | "low";

type TopicDefinition = {
  key: string;
  title: string;
  description: string;
  keywords: string[];
};

type TopicSignal = {
  key: string;
  title: string;
  description: string;
  count: number;
  averageRating: number;
  criticalCount: number;
  positiveCount: number;
  evidence: Feedback[];
  sentiment:
    | "attention"
    | "positive"
    | "mixed";
  confidence: SignalConfidence;
};

type PrimaryInsight = {
  type: SignalType;
  title: string;
  description: string;
  metric: string;
  supporting: string;
  confidence: SignalConfidence;
};

type DayPoint = {
  key: string;
  date: Date;
  label: string;
  scans: number;
  feedbackCount: number;
  average: number | null;
};

type RatingDistribution = {
  rating: number;
  count: number;
  percentage: number;
};

/* =========================================================
   DESIGN TOKENS
   ========================================================= */

const COLORS = {
  ink: "#183B4E",
  inkSoft: "#53656C",
  muted: "#7C8A90",
  mutedLight: "#8E9A9F",

  ivory: "#F7F6F2",
  white: "#FFFFFF",

  border: "#DEE5E1",
  borderSoft: "#E8ECE8",

  teal: "#25B7A4",
  tealDark: "#168F7F",
  tealSoft: "#E3F5F0",

  coral: "#E97862",
  coralDark: "#C75E4B",
  coralSoft: "#FBE8E3",

  blueSoft: "#E8F0F4",

  neutralSoft: "#F4F7F4",

  yellow: "#E2A93B",
  yellowSoft: "#FFF7DF",
};

/* =========================================================
   TOPIC DEFINITIONS
   ---------------------------------------------------------
   This is intentionally transparent keyword-based logic.
   It is NOT presented as AI.
   ========================================================= */

const TOPICS: TopicDefinition[] = [
  {
    key: "music",
    title: "Música y volumen",
    description:
      "Comentarios relacionados con música, ruido, sonido o volumen.",
    keywords: [
      "musica",
      "volumen",
      "ruido",
      "sonido",
      "audio",
    ],
  },
  {
    key: "wait",
    title: "Tiempos de espera",
    description:
      "Comentarios relacionados con demoras, rapidez o tiempos de atención.",
    keywords: [
      "espera",
      "esperando",
      "demora",
      "demorado",
      "demorada",
      "lento",
      "lenta",
      "rapido",
      "rapida",
    ],
  },
  {
    key: "attention",
    title: "Atención del personal",
    description:
      "Comentarios relacionados con atención, empleados o servicio.",
    keywords: [
      "atencion",
      "personal",
      "empleado",
      "empleados",
      "mozo",
      "mozos",
      "servicio",
    ],
  },
  {
    key: "cleanliness",
    title: "Limpieza",
    description:
      "Comentarios relacionados con limpieza, higiene o suciedad.",
    keywords: [
      "limpieza",
      "limpio",
      "limpia",
      "sucio",
      "sucia",
      "suciedad",
      "higiene",
    ],
  },
  {
    key: "price",
    title: "Precio",
    description:
      "Comentarios relacionados con precio, costo o valor percibido.",
    keywords: [
      "precio",
      "precios",
      "caro",
      "cara",
      "caros",
      "caras",
      "barato",
      "barata",
      "costoso",
      "costosa",
    ],
  },
  {
    key: "food",
    title: "Comida",
    description:
      "Comentarios relacionados con comida, platos, sabor o cocina.",
    keywords: [
      "comida",
      "plato",
      "platos",
      "sabor",
      "cocina",
      "menu",
    ],
  },
  {
    key: "space",
    title: "Ambiente y espacio",
    description:
      "Comentarios relacionados con el ambiente, espacio o temperatura.",
    keywords: [
      "ambiente",
      "espacio",
      "lugar",
      "temperatura",
      "frio",
      "calor",
    ],
  },
];

/* =========================================================
   ICON
   ========================================================= */

function Icon({
  name,
  size = 18,
}: {
  name:
    | "activity"
    | "arrow"
    | "back"
    | "calendar"
    | "check"
    | "comment"
    | "filter"
    | "insight"
    | "menu"
    | "nfc"
    | "qr"
    | "scan"
    | "spark"
    | "star"
    | "target"
    | "trendDown"
    | "trendUp"
    | "users"
    | "warning"
    | "x"
    | "refresh"
    | "info";
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

  switch (name) {
    case "activity":
      return (
        <svg {...common}>
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        </svg>
      );

    case "arrow":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );

    case "back":
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="m11 18-6-6 6-6" />
        </svg>
      );

    case "calendar":
      return (
        <svg {...common}>
          <rect
            x="3"
            y="4"
            width="18"
            height="17"
            rx="3"
          />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 9h18" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4L19 6" />
        </svg>
      );

    case "comment":
      return (
        <svg {...common}>
          <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 3v-7.2A7.5 7.5 0 1 1 20 11.5Z" />
        </svg>
      );

    case "filter":
      return (
        <svg {...common}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );

    case "insight":
      return (
        <svg {...common}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M8.5 14.5a6 6 0 1 1 7 0c-.9.7-1.5 1.5-1.5 2.5h-4c0-1-.6-1.8-1.5-2.5Z" />
        </svg>
      );

    case "menu":
      return (
        <svg {...common}>
          <path d="M5 7h14" />
          <path d="M5 12h14" />
          <path d="M5 17h14" />
        </svg>
      );

    case "nfc":
      return (
        <svg {...common}>
          <path d="M6 8a8 8 0 0 0 0 8" />
          <path d="M9 10.5a4 4 0 0 0 0 3" />
          <path d="M12 12v.01" />
          <path d="M18 8a8 8 0 0 1 0 8" />
          <path d="M15 10.5a4 4 0 0 1 0 3" />
        </svg>
      );

    case "qr":
      return (
        <svg {...common}>
          <path d="M4 4h6v6H4z" />
          <path d="M14 4h6v6h-6z" />
          <path d="M4 14h6v6H4z" />
          <path d="M14 14h2v2h-2z" />
          <path d="M18 14h2v6h-6v-2h4z" />
        </svg>
      );

    case "scan":
      return (
        <svg {...common}>
          <path d="M4 8V5a1 1 0 0 1 1-1h3" />
          <path d="M16 4h3a1 1 0 0 1 1 1v3" />
          <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
          <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
          <path d="M8 8h8v8H8z" />
        </svg>
      );

    case "spark":
      return (
        <svg {...common}>
          <path d="m12 2 1.4 6.1L19 10l-5.6 1.9L12 18l-1.4-6.1L5 10l5.6-1.9L12 2Z" />
          <path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" />
        </svg>
      );

    case "star":
      return (
        <svg {...common}>
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      );

    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
        </svg>
      );

    case "trendDown":
      return (
        <svg {...common}>
          <path d="M4 7 10 13l4-4 6 6" />
          <path d="M15 15h5v-5" />
        </svg>
      );

    case "trendUp":
      return (
        <svg {...common}>
          <path d="m4 16 6-6 4 4 6-7" />
          <path d="M15 7h5v5" />
        </svg>
      );

    case "users":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="4" />
          <path d="M17 11a4 4 0 1 0 0-8" />
          <path d="M21 21v-2a4 4 0 0 0-3-3.9" />
        </svg>
      );

    case "warning":
      return (
        <svg {...common}>
          <path d="M10.3 4.5 3.6 16a2 2 0 0 0 1.7 3h13.4a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v4" />
          <path d="M12 16h.01" />
        </svg>
      );

    case "refresh":
      return (
        <svg {...common}>
          <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
          <path d="M3 5v5h5" />
          <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
          <path d="M21 19v-5h-5" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6" />
          <path d="M12 7h.01" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="m6 6 12 12" />
          <path d="m18 6-12 12" />
        </svg>
      );

    default:
      return null;
  }
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function keywordMatches(
  text: string,
  keyword: string
) {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);

  const words = normalizedText
    .split(/\s+/)
    .filter(Boolean);

  return words.some((word) => {
    if (word === normalizedKeyword) {
      return true;
    }

    if (
      normalizedKeyword.length >= 5 &&
      word.startsWith(normalizedKeyword)
    ) {
      return true;
    }

    return false;
  });
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function getDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(
    "es-AR",
    {
      day: "numeric",
      month: "short",
    }
  );
}

function formatLongDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(
    "es-AR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
}

function confidenceLabel(
  confidence: SignalConfidence
) {
  if (confidence === "high") {
    return "Alta";
  }

  if (confidence === "medium") {
    return "Media";
  }

  return "Inicial";
}

function confidenceClass(
  confidence: SignalConfidence
) {
  if (confidence === "high") {
    return "bg-[#E3F5F0] text-[#168F7F]";
  }

  if (confidence === "medium") {
    return "bg-[#E8F0F4] text-[#183B4E]";
  }

  return "bg-[#F2F4F2] text-[#6E7D83]";
}

function ratingLabel(rating: number) {
  if (rating === 5) return "Excelente";
  if (rating === 4) return "Muy buena";
  if (rating === 3) return "Neutral";
  if (rating === 2) return "Baja";
  return "Muy baja";
}

/* =========================================================
   STARS
   ========================================================= */

function Stars({
  rating,
  size = "small",
}: {
  rating: number;
  size?: "small" | "medium" | "large";
}) {
  const className =
    size === "large"
      ? "text-base"
      : size === "medium"
        ? "text-sm"
        : "text-[11px]";

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
    >
      {Array.from(
        { length: 5 },
        (_, index) => (
          <span
            key={index}
            className={
              index < rating
                ? "text-[#E2A93B]"
                : "text-[#D9DFDB]"
            }
          >
            ★
          </span>
        )
      )}
    </div>
  );
}

/* =========================================================
   SECTION HEADER
   ========================================================= */

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[#7C8A90]">
          {eyebrow}
        </p>

        <h3 className="mt-1.5 text-[19px] font-semibold tracking-[-0.03em] text-[#183B4E]">
          {title}
        </h3>

        {description && (
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-[#718087]">
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function LoadingPage() {
  return (
    <main className="min-h-screen bg-[#F7F6F2] px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[30px] border border-[#E1E6E2] bg-white">
        <div className="border-b border-[#E5EAE6] p-5 sm:p-7">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-[#EDF1EE]" />
        </div>

        <div className="p-5 sm:p-8">
          <div className="h-3 w-24 animate-pulse rounded bg-[#EDF1EE]" />
          <div className="mt-3 h-11 w-80 animate-pulse rounded-xl bg-[#EDF1EE]" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-[21px] bg-[#F0F3F0]"
              />
            ))}
          </div>

          <div className="mt-5 h-72 animate-pulse rounded-[25px] bg-[#F0F3F0]" />

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-[25px] bg-[#F0F3F0]" />
            <div className="h-80 animate-pulse rounded-[25px] bg-[#F0F3F0]" />
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

export default function AnalyticsPage() {
  const [business, setBusiness] =
    useState<Business | null>(null);

  const [scans, setScans] =
    useState<ScanEvent[]>([]);

  const [feedback, setFeedback] =
    useState<Feedback[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [period, setPeriod] =
    useState<PeriodKey>("30");

  const [commentFilter, setCommentFilter] =
    useState<CommentFilter>("all");

  const [showAllComments, setShowAllComments] =
    useState(false);

  const [serverIntelligence, setServerIntelligence] =
    useState<{
      totalAnalyses: number;
      primaryInsight: {
        type:
          | "attention"
          | "strength"
          | "emerging"
          | "observation";
        title: string;
        description: string;
        metric: string;
        supporting: string;
        confidence: number;
      } | null;
    } | null>(null);
  const [selectedTopic, setSelectedTopic] =
    useState<TopicSignal | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "No hay una sesión iniciada."
        );
        return;
      }

      const {
        data: businessUser,
        error: businessUserError,
      } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", user.id)
        .single();

      if (
        businessUserError ||
        !businessUser
      ) {
        console.error(
          businessUserError
        );

        setError(
          "No encontramos un negocio asociado a tu cuenta."
        );

        return;
      }

      const {
        data: businessData,
        error: businessError,
      } = await supabase
        .from("businesses")
        .select(
          "id, name, logo_url"
        )
        .eq(
          "id",
          businessUser.business_id
        )
        .single();

      if (
        businessError ||
        !businessData
      ) {
        console.error(
          businessError
        );

        setError(
          "No pudimos cargar tu negocio."
        );

        return;
      }

      const {
        data: scanData,
        error: scanError,
      } = await supabase
        .from("scan_events")
        .select(
          "id, source, created_at"
        )
        .eq(
          "business_id",
          businessData.id
        )
        .order(
          "created_at",
          { ascending: false }
        );

      if (scanError) {
        console.error(scanError);

        setError(
          "No pudimos cargar los escaneos."
        );

        return;
      }

      const {
        data: feedbackData,
        error: feedbackError,
      } = await supabase
        .from("feedback")
        .select(
          "id, rating, message, created_at, scan_event_id"
        )
        .eq(
          "business_id",
          businessData.id
        )
        .order(
          "created_at",
          { ascending: false }
        );

      if (feedbackError) {
        console.error(
          feedbackError
        );

        setError(
          "No pudimos cargar las valoraciones."
        );

        return;
      }

      setBusiness(businessData);
      setScans(scanData || []);
      setFeedback(feedbackData || []);
      try {
        const intelligenceResponse =
          await fetch(
            `/api/analytics/intelligence?businessId=${businessData.id}`,
            {
              cache: "no-store",
            }
          );

        if (intelligenceResponse.ok) {
          const intelligenceData =
            await intelligenceResponse.json();

          if (intelligenceData.ok) {
            setServerIntelligence(
              intelligenceData
            );
          }
        }
      } catch (intelligenceError) {
        console.error(
          "No se pudo cargar GuestTap Intelligence:",
          intelligenceError
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Ocurrió un error al cargar Analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshAnalytics() {
    setRefreshing(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const {
        data: businessUser,
      } = await supabase
        .from("business_users")
        .select("business_id")
        .eq("user_id", user.id)
        .single();

      if (!businessUser) return;

      const [
        scanResult,
        feedbackResult,
      ] = await Promise.all([
        supabase
          .from("scan_events")
          .select(
            "id, source, created_at"
          )
          .eq(
            "business_id",
            businessUser.business_id
          )
          .order(
            "created_at",
            { ascending: false }
          ),

        supabase
          .from("feedback")
          .select(
            "id, rating, message, created_at, scan_event_id"
          )
          .eq(
            "business_id",
            businessUser.business_id
          )
          .order(
            "created_at",
            { ascending: false }
          ),
      ]);

      if (!scanResult.error) {
        setScans(
          scanResult.data || []
        );
      }

      if (!feedbackResult.error) {
        setFeedback(
          feedbackResult.data || []
        );
      }
    } finally {
      setRefreshing(false);
    }
  }

  /* =======================================================
     ANALYTICS ENGINE
     ======================================================= */

  const analytics = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);

    const tomorrow = new Date(today);
    tomorrow.setDate(
      tomorrow.getDate() + 1
    );

    let days = 30;

    if (period === "7") {
      days = 7;
    }

    if (period === "90") {
      days = 90;
    }

    const periodStart = new Date(today);

    if (period !== "all") {
      periodStart.setDate(
        periodStart.getDate() -
          (days - 1)
      );
    } else {
      periodStart.setTime(0);
    }

    const previousStart = new Date(
      periodStart
    );

    const previousEnd = new Date(
      periodStart
    );

    if (period !== "all") {
      previousStart.setDate(
        previousStart.getDate() - days
      );
    }

    const periodFeedback =
      period === "all"
        ? feedback
        : feedback.filter((item) => {
            const date = new Date(
              item.created_at
            );

            return (
              date >= periodStart &&
              date < tomorrow
            );
          });

    const previousFeedback =
      period === "all"
        ? []
        : feedback.filter((item) => {
            const date = new Date(
              item.created_at
            );

            return (
              date >= previousStart &&
              date < previousEnd
            );
          });

    const periodScans =
      period === "all"
        ? scans
        : scans.filter((item) => {
            const date = new Date(
              item.created_at
            );

            return (
              date >= periodStart &&
              date < tomorrow
            );
          });

    const previousScans =
      period === "all"
        ? []
        : scans.filter((item) => {
            const date = new Date(
              item.created_at
            );

            return (
              date >= previousStart &&
              date < previousEnd
            );
          });

    /* -------------------------------------------------------
       RATING
       ------------------------------------------------------- */

    const average =
      periodFeedback.length > 0
        ? Number(
            (
              periodFeedback.reduce(
                (sum, item) =>
                  sum + item.rating,
                0
              ) /
              periodFeedback.length
            ).toFixed(1)
          )
        : null;

    const previousAverage =
      previousFeedback.length > 0
        ? Number(
            (
              previousFeedback.reduce(
                (sum, item) =>
                  sum + item.rating,
                0
              ) /
              previousFeedback.length
            ).toFixed(1)
          )
        : null;

    const averageChange =
      average !== null &&
      previousAverage !== null
        ? Number(
            (
              average -
              previousAverage
            ).toFixed(1)
          )
        : null;

    const positiveCount =
      periodFeedback.filter(
        (item) => item.rating >= 4
      ).length;

    const neutralCount =
      periodFeedback.filter(
        (item) => item.rating === 3
      ).length;

    const criticalCount =
      periodFeedback.filter(
        (item) => item.rating <= 2
      ).length;

    const positivePercentage =
      periodFeedback.length > 0
        ? Math.round(
            (positiveCount /
              periodFeedback.length) *
              100
          )
        : 0;

    const neutralPercentage =
      periodFeedback.length > 0
        ? Math.round(
            (neutralCount /
              periodFeedback.length) *
              100
          )
        : 0;

    const criticalPercentage =
      periodFeedback.length > 0
        ? Math.round(
            (criticalCount /
              periodFeedback.length) *
              100
          )
        : 0;

    /* -------------------------------------------------------
       COMMENTS
       ------------------------------------------------------- */

    const comments =
      periodFeedback.filter(
        (item) =>
          typeof item.message ===
            "string" &&
          item.message.trim().length > 0
      );

    const positiveComments =
      comments.filter(
        (item) => item.rating >= 4
      );

    const criticalComments =
      comments.filter(
        (item) => item.rating <= 2
      );

    /* -------------------------------------------------------
       DISTRIBUTION
       ------------------------------------------------------- */

    const ratingDistribution: RatingDistribution[] =
      [5, 4, 3, 2, 1].map(
        (rating) => {
          const count =
            periodFeedback.filter(
              (item) =>
                item.rating === rating
            ).length;

          return {
            rating,
            count,
            percentage:
              periodFeedback.length > 0
                ? Math.round(
                    (count /
                      periodFeedback.length) *
                      100
                  )
                : 0,
          };
        }
      );

    /* -------------------------------------------------------
       SCANS
       ------------------------------------------------------- */

    const qrScans =
      periodScans.filter(
        (scan) =>
          (scan.source || "qr")
            .toLowerCase() === "qr"
      ).length;

    const nfcScans =
      periodScans.filter(
        (scan) =>
          (scan.source || "")
            .toLowerCase() === "nfc"
      ).length;

    const scansToday =
      scans.filter((scan) => {
        const date = new Date(
          scan.created_at
        );

        return (
          date >= today &&
          date < tomorrow
        );
      }).length;

    /* -------------------------------------------------------
       ATTRIBUTABLE CONVERSION
       -------------------------------------------------------
       Only feedback with a scan_event_id can be attributed
       to an actual scan.

       The denominator is period scans.
       The numerator is unique scans with feedback.
       ------------------------------------------------------- */

    const convertedScanIds =
      new Set<number>();

    for (const item of periodFeedback) {
      if (
        typeof item.scan_event_id ===
        "number"
      ) {
        convertedScanIds.add(
          item.scan_event_id
        );
      }
    }

    const convertedScans =
      periodScans.filter((scan) =>
        convertedScanIds.has(scan.id)
      ).length;

    const conversion =
      periodScans.length > 0
        ? Math.round(
            (convertedScans /
              periodScans.length) *
              100
          )
        : null;

    /* -------------------------------------------------------
       PREVIOUS CONVERSION
       ------------------------------------------------------- */

    const previousScanIds =
      new Set<number>();

    for (const item of previousFeedback) {
      if (
        typeof item.scan_event_id ===
        "number"
      ) {
        previousScanIds.add(
          item.scan_event_id
        );
      }
    }

    const previousConvertedScans =
      previousScans.filter((scan) =>
        previousScanIds.has(scan.id)
      ).length;

    const previousConversion =
      previousScans.length > 0
        ? Math.round(
            (previousConvertedScans /
              previousScans.length) *
              100
          )
        : null;

    const conversionChange =
      conversion !== null &&
      previousConversion !== null
        ? conversion -
          previousConversion
        : null;

    /* -------------------------------------------------------
       SCAN CHANGE
       ------------------------------------------------------- */

    const scanChange =
      previousScans.length > 0
        ? Math.round(
            ((periodScans.length -
              previousScans.length) /
              previousScans.length) *
              100
          )
        : null;

    /* -------------------------------------------------------
       DAILY CHART
       ------------------------------------------------------- */

    const chartDays =
      period === "7"
        ? 7
        : period === "30"
          ? 14
          : 14;

    const chartStart = new Date(
      today
    );

    chartStart.setDate(
      chartStart.getDate() -
        (chartDays - 1)
    );

    const daily: DayPoint[] =
      Array.from(
        { length: chartDays },
        (_, index) => {
          const date = new Date(
            chartStart
          );

          date.setDate(
            chartStart.getDate() +
              index
          );

          const key =
            getDayKey(date);

          const dayScans =
            scans.filter(
              (scan) =>
                getDayKey(
                  new Date(
                    scan.created_at
                  )
                ) === key
            );

          const dayFeedback =
            feedback.filter(
              (item) =>
                getDayKey(
                  new Date(
                    item.created_at
                  )
                ) === key
            );

          const dayAverage =
            dayFeedback.length > 0
              ? Number(
                  (
                    dayFeedback.reduce(
                      (sum, item) =>
                        sum +
                        item.rating,
                      0
                    ) /
                    dayFeedback.length
                  ).toFixed(1)
                )
              : null;

          return {
            key,
            date,
            label:
              formatDayLabel(date),
            scans:
              dayScans.length,
            feedbackCount:
              dayFeedback.length,
            average:
              dayAverage,
          };
        }
      );

    /* -------------------------------------------------------
       TOPICS
       ------------------------------------------------------- */

    const topicSignals: TopicSignal[] =
      TOPICS.map((topic) => {
        const matching =
          comments.filter((item) => {
            if (!item.message) {
              return false;
            }

            return topic.keywords.some(
              (keyword) =>
                keywordMatches(
                  item.message!,
                  keyword
                )
            );
          });

        if (matching.length === 0) {
          return null;
        }

        const topicAverage =
          matching.reduce(
            (sum, item) =>
              sum + item.rating,
            0
          ) / matching.length;

        const topicCritical =
          matching.filter(
            (item) => item.rating <= 2
          ).length;

        const topicPositive =
          matching.filter(
            (item) => item.rating >= 4
          ).length;

        let sentiment:
          | "attention"
          | "positive"
          | "mixed" =
          "mixed";

        if (
          topicAverage >= 4 &&
          topicPositive >=
            topicCritical
        ) {
          sentiment = "positive";
        }

        if (
          topicAverage < 3.5 ||
          topicCritical >
            topicPositive
        ) {
          sentiment = "attention";
        }

        let confidence:
          SignalConfidence =
          "low";

        if (
          matching.length >= 5 &&
          topicCritical >= 2
        ) {
          confidence = "high";
        } else if (
          matching.length >= 3
        ) {
          confidence = "medium";
        }

        return {
          key: topic.key,
          title: topic.title,
          description:
            topic.description,
          count: matching.length,
          averageRating:
            Number(
              topicAverage.toFixed(1)
            ),
          criticalCount:
            topicCritical,
          positiveCount:
            topicPositive,
          evidence:
            matching.slice(0, 5),
          sentiment,
          confidence,
        };
      }).filter(
        (
          item
        ): item is TopicSignal =>
          item !== null
      );

    const attentionSignals =
      topicSignals
        .filter(
          (signal) =>
            signal.sentiment ===
            "attention"
        )
        .sort((a, b) => {
          if (
            b.criticalCount !==
            a.criticalCount
          ) {
            return (
              b.criticalCount -
              a.criticalCount
            );
          }

          return (
            b.count - a.count
          );
        });

    const positiveSignals =
      topicSignals
        .filter(
          (signal) =>
            signal.sentiment ===
            "positive"
        )
        .sort(
          (a, b) =>
            b.count - a.count
        );

    /* -------------------------------------------------------
       DATA QUALITY
       ------------------------------------------------------- */

    const commentsWithRating =
      comments.length;

    const attributableFeedback =
      periodFeedback.filter(
        (item) =>
          typeof item.scan_event_id ===
          "number"
      ).length;

    const unattributedFeedback =
      periodFeedback.length -
      attributableFeedback;

    /* -------------------------------------------------------
       PRIMARY INSIGHT
       ------------------------------------------------------- */

    let primaryInsight:
      | PrimaryInsight
      | null = null;

    /*
      Rule 1:
      Strong period-over-period movement,
      but only when both samples are >= 5.
    */

    if (
      averageChange !== null &&
      Math.abs(averageChange) >= 0.5 &&
      periodFeedback.length >= 5 &&
      previousFeedback.length >= 5
    ) {
      if (averageChange > 0) {
        primaryInsight = {
          type: "change",
          title:
            "La satisfacción está mejorando.",
          description:
            "El promedio de valoración aumentó de forma material frente al período anterior.",
          metric: `+${averageChange.toFixed(
            1
          )} ★`,
          supporting: `${previousAverage!.toFixed(
            1
          )} → ${average!.toFixed(
            1
          )} · ${formatNumber(
            periodFeedback.length
          )} respuestas actuales`,
          confidence: "high",
        };
      } else {
        primaryInsight = {
          type: "attention",
          title:
            "La satisfacción está bajando.",
          description:
            "El promedio de valoración cayó de forma material frente al período anterior.",
          metric: `${averageChange.toFixed(
            1
          )} ★`,
          supporting: `${previousAverage!.toFixed(
            1
          )} → ${average!.toFixed(
            1
          )} · ${formatNumber(
            periodFeedback.length
          )} respuestas actuales`,
          confidence: "high",
        };
      }
    }

    /*
      Rule 2:
      A topic with at least 3 mentions and
      negative evidence can become the primary
      attention signal.
    */

    if (
      !primaryInsight &&
      attentionSignals.length > 0
    ) {
      const signal =
        attentionSignals[0];

      if (signal.count >= 3) {
        primaryInsight = {
          type: "attention",
          title: `${signal.title} concentra comentarios negativos.`,
          description:
            "El tema aparece varias veces y las valoraciones asociadas están por debajo de la zona positiva.",
          metric: `${signal.count} menciones`,
          supporting: `${signal.averageRating} ★ promedio · ${signal.criticalCount} críticas`,
          confidence:
            signal.confidence,
        };
      }
    }

    /*
      Rule 3:
      Strong positive theme.
    */

    if (
      !primaryInsight &&
      positiveSignals.length > 0
    ) {
      const signal =
        positiveSignals[0];

      if (
        signal.count >= 3
      ) {
        primaryInsight = {
          type: "strength",
          title: `${signal.title} aparece como fortaleza.`,
          description:
            "Hay varias menciones positivas asociadas a este aspecto de la experiencia.",
          metric: `${signal.averageRating} ★`,
          supporting: `${signal.count} menciones relacionadas`,
          confidence:
            signal.confidence,
        };
      }
    }

    /*
      Rule 4:
      If data is small, explicitly say that.
    */

    if (
      !primaryInsight &&
      periodFeedback.length > 0
    ) {
      primaryInsight = {
        type: "observation",
        title:
          "GuestTap ya está capturando experiencia real.",
        description:
          "Todavía no hay suficiente evidencia para declarar una tendencia o un problema recurrente.",
        metric: formatNumber(
          periodFeedback.length
        ),
        supporting:
          "valoraciones en el período",
        confidence: "low",
      };
    }

    return {
      periodFeedback,
      previousFeedback,

      periodScans,
      previousScans,

      average,
      previousAverage,
      averageChange,

      positiveCount,
      neutralCount,
      criticalCount,

      positivePercentage,
      neutralPercentage,
      criticalPercentage,

      comments,
      positiveComments,
      criticalComments,

      ratingDistribution,

      qrScans,
      nfcScans,
      scansToday,

      convertedScans,
      conversion,
      previousConversion,
      conversionChange,

      scanChange,

      daily,

      topicSignals,
      attentionSignals,
      positiveSignals,

      primaryInsight,

      attributableFeedback,
      unattributedFeedback,
      commentsWithRating,

      totalFeedback:
        feedback.length,
      totalScans:
        scans.length,
    };
  }, [
    feedback,
    scans,
    period,
  ]);

  /* =======================================================
     COMMENT FILTER
     ======================================================= */

  const filteredComments =
    useMemo(() => {
      let result =
        analytics.comments;

      if (
        commentFilter ===
        "positive"
      ) {
        result =
          result.filter(
            (item) =>
              item.rating >= 4
          );
      }

      if (
        commentFilter ===
        "critical"
      ) {
        result =
          result.filter(
            (item) =>
              item.rating <= 2
          );
      }

      return showAllComments
        ? result
        : result.slice(0, 6);
    }, [
      analytics.comments,
      commentFilter,
      showAllComments,
    ]);

  /* =======================================================
     LOADING
     ======================================================= */

  if (loading) {
    return <LoadingPage />;
  }

  /* =======================================================
     ERROR
     ======================================================= */

  if (
    error ||
    !business
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F6F2] px-5">
        <div className="w-full max-w-md rounded-[28px] border border-[#DEE5E1] bg-white p-8 text-center shadow-[0_20px_60px_rgba(24,59,78,0.08)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[17px] bg-[#183B4E] text-xs font-bold text-white">
            GT
          </div>

          <p className="mt-6 text-[9px] font-bold uppercase tracking-[0.2em] text-[#7C8A90]">
            GuestTap
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#183B4E]">
            No pudimos cargar Analytics.
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#718087]">
            {error ||
              "No encontramos tu negocio."}
          </p>

          <a
            href="/panel"
            className="mt-7 inline-flex items-center gap-2 rounded-[13px] bg-[#183B4E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#234D62]"
          >
            Volver al panel
            <Icon
              name="arrow"
              size={14}
            />
          </a>
        </div>
      </main>
    );
  }

  /* =======================================================
     INSIGHT COLORS
     ======================================================= */

  const insight =
    analytics.primaryInsight;

  const insightIsAttention =
    insight?.type ===
    "attention";

  const insightIsStrength =
    insight?.type ===
    "strength";

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <main className="min-h-screen bg-[#F7F6F2] text-[#183B4E]">
      <div className="mx-auto max-w-[1240px] px-3 py-3 sm:px-5 sm:py-5">
        <div className="overflow-hidden rounded-[30px] border border-[#DFE5E1] bg-[#F7F6F2] shadow-[0_15px_60px_rgba(24,59,78,0.055)]">

          {/* =================================================
              HEADER
             ================================================= */}

          <header className="border-b border-[#E3E8E4] bg-white">
            <div className="flex items-center justify-between px-5 py-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                {business.logo_url ? (
                  <img
                    src={
                      business.logo_url
                    }
                    alt={
                      business.name
                    }
                    className="h-11 w-11 shrink-0 rounded-[14px] object-cover ring-1 ring-[#DDE4DF]"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#183B4E] text-xs font-bold text-white">
                    {getInitials(
                      business.name
                    )}
                  </div>
                )}

                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-[#87949A]">
                    GuestTap
                  </p>

                  <h1 className="truncate text-base font-semibold tracking-[-0.025em] text-[#183B4E] sm:text-lg">
                    Experiencia
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={
                    refreshAnalytics
                  }
                  disabled={
                    refreshing
                  }
                  className="hidden items-center gap-2 rounded-[12px] border border-[#DDE4E0] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#53656C] transition hover:bg-[#F7F9F7] disabled:opacity-60 sm:flex"
                >
                  <span
                    className={
                      refreshing
                        ? "animate-spin"
                        : ""
                    }
                  >
                    <Icon
                      name="refresh"
                      size={14}
                    />
                  </span>

                  Actualizar
                </button>

                <a
                  href="/panel"
                  className="flex items-center gap-2 rounded-[12px] border border-[#DDE4E0] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#53656C] transition hover:bg-[#F7F9F7]"
                >
                  <Icon
                    name="back"
                    size={14}
                  />

                  <span className="hidden sm:inline">
                    Volver al panel
                  </span>

                  <span className="sm:hidden">
                    Volver
                  </span>
                </a>
              </div>
            </div>
          </header>

          {/* =================================================
              CONTENT
             ================================================= */}

          <div className="mx-auto max-w-[1160px] px-5 py-8 sm:px-7 sm:py-10 lg:px-8 lg:py-12">

            {/* =================================================
                INTRO
               ================================================= */}

            <section>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#25B7A4]" />

                    <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[#7C8A90]">
                      {business.name}
                    </p>
                  </div>

                  <h2 className="mt-2 text-[36px] font-semibold leading-[1.02] tracking-[-0.06em] text-[#183B4E] sm:text-[48px]">
                    La experiencia de tus clientes.
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#718087] sm:text-[15px]">
                    Una lectura de lo que están valorando,
                    dónde aparecen problemas y qué señales
                    merecen tu atención.
                  </p>
                </div>

                {/* PERIOD */}

                <div className="flex w-full items-center rounded-[14px] border border-[#DDE4E0] bg-white p-1 shadow-[0_2px_8px_rgba(24,59,78,0.025)] sm:w-auto">
                  {(
                    [
                      [
                        "7",
                        "7 días",
                      ],
                      [
                        "30",
                        "30 días",
                      ],
                      [
                        "90",
                        "90 días",
                      ],
                      [
                        "all",
                        "Todo",
                      ],
                    ] as [
                      PeriodKey,
                      string
                    ][]
                  ).map(
                    ([
                      key,
                      label,
                    ]) => {
                      const active =
                        period ===
                        key;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setPeriod(
                              key
                            );
                            setShowAllComments(
                              false
                            );
                          }}
                          className={`flex-1 rounded-[10px] px-3 py-2 text-[10px] font-semibold transition sm:flex-none sm:px-3.5 ${
                            active
                              ? "bg-[#183B4E] text-white shadow-[0_3px_8px_rgba(24,59,78,0.16)]"
                              : "text-[#68787F] hover:bg-[#F3F6F3]"
                          }`}
                        >
                          {
                            label
                          }
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </section>

            {/* =================================================
                BUSINESS HEALTH
               ================================================= */}

            <section className="mt-7 overflow-hidden rounded-[26px] border border-[#DDE5E0] bg-white shadow-[0_7px_25px_rgba(24,59,78,0.04)]">
              <div className="grid lg:grid-cols-[1.15fr_0.85fr]">

                {/* SCORE */}

                <div className="p-6 sm:p-8 lg:p-9">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7C8A90]">
                        Satisfacción
                      </p>

                      <h3 className="mt-2 text-lg font-semibold tracking-[-0.025em] text-[#183B4E]">
                        Cómo está viviendo la experiencia tu cliente.
                      </h3>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#E3F5F0] text-[#168F7F]">
                      <Icon
                        name="star"
                        size={17}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex items-end gap-4">
                    <span className="text-[66px] font-semibold leading-none tracking-[-0.075em] text-[#183B4E] sm:text-[78px]">
                      {analytics.average !==
                      null
                        ? analytics.average.toFixed(
                            1
                          )
                        : "—"}
                    </span>

                    <div className="pb-1">
                      <Stars
                        rating={
                          analytics.average !==
                          null
                            ? Math.round(
                                analytics.average
                              )
                            : 0
                        }
                        size="large"
                      />

                      <p className="mt-1 text-xs text-[#7C8A90]">
                        sobre 5 estrellas
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    {analytics.averageChange !==
                    null ? (
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                          analytics.averageChange >
                          0
                            ? "bg-[#E3F5F0] text-[#168F7F]"
                            : analytics.averageChange <
                                0
                              ? "bg-[#FBE8E3] text-[#C75E4B]"
                              : "bg-[#F1F4F1] text-[#68787F]"
                        }`}
                      >
                        {analytics.averageChange >
                        0 ? (
                          <Icon
                            name="trendUp"
                            size={13}
                          />
                        ) : analytics.averageChange <
                          0 ? (
                          <Icon
                            name="trendDown"
                            size={13}
                          />
                        ) : (
                          <span>
                            →
                          </span>
                        )}

                        {analytics.averageChange >
                        0
                          ? "+"
                          : ""}
                        {analytics.averageChange.toFixed(
                          1
                        )}{" "}
                        ★
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#F1F4F1] px-3 py-1.5 text-xs font-semibold text-[#68787F]">
                        Sin comparación
                      </span>
                    )}

                    <span className="text-xs text-[#7A888E]">
                      {formatNumber(
                        analytics.periodFeedback.length
                      )}{" "}
                      valoraciones
                    </span>
                  </div>

                  {analytics.averageChange !==
                    null &&
                    analytics.periodFeedback
                      .length >= 5 &&
                    analytics.previousFeedback
                      .length >= 5 && (
                      <p className="mt-3 text-[10px] leading-5 text-[#8A979C]">
                        Comparación contra un período anterior
                        de la misma duración.
                      </p>
                    )}
                </div>

                {/* COMPOSITION */}

                <div className="border-t border-[#E5EAE6] bg-[#F8FAF8] p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-9">
                  <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#7C8A90]">
                    Composición
                  </p>

                  <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.025em] text-[#183B4E]">
                    Cómo se distribuyen las respuestas.
                  </h3>

                  <div className="mt-6 grid grid-cols-3 gap-2.5">
                    <div className="rounded-[17px] bg-white p-3.5 ring-1 ring-[#E5EBE7]">
                      <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#839096]">
                        Positivas
                      </p>

                      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#168F7F]">
                        {
                          analytics.positivePercentage
                        }
                        %
                      </p>

                      <p className="mt-1 text-[9px] text-[#819097]">
                        4–5 ★
                      </p>
                    </div>

                    <div className="rounded-[17px] bg-white p-3.5 ring-1 ring-[#E5EBE7]">
                      <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#839096]">
                        Neutras
                      </p>

                      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#53656C]">
                        {
                          analytics.neutralPercentage
                        }
                        %
                      </p>

                      <p className="mt-1 text-[9px] text-[#819097]">
                        3 ★
                      </p>
                    </div>

                    <div className="rounded-[17px] bg-white p-3.5 ring-1 ring-[#E5EBE7]">
                      <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#839096]">
                        Atención
                      </p>

                      <p className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-[#C75E4B]">
                        {
                          analytics.criticalPercentage
                        }
                        %
                      </p>

                      <p className="mt-1 text-[9px] text-[#819097]">
                        1–2 ★
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex h-2 overflow-hidden rounded-full bg-[#E7ECE8]">
                      <div
                        className="h-full bg-[#25B7A4]"
                        style={{
                          width: `${analytics.positivePercentage}%`,
                        }}
                      />

                      <div
                        className="h-full bg-[#AAB4B7]"
                        style={{
                          width: `${analytics.neutralPercentage}%`,
                        }}
                      />

                      <div
                        className="h-full bg-[#E97862]"
                        style={{
                          width: `${analytics.criticalPercentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                PRIMARY INSIGHT
               ================================================= */}

            {insight && (
              <section className="mt-5">
                <div
                  className={`rounded-[25px] border p-6 sm:p-7 lg:p-8 ${
                    insightIsAttention
                      ? "border-[#F0D4CD] bg-[#FFF9F7]"
                      : insightIsStrength
                        ? "border-[#CFE8E1] bg-[#F6FCFA]"
                        : "border-[#D7E3E8] bg-[#F7FAFB]"
                  }`}
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                          insightIsAttention
                            ? "bg-[#FBE7E2] text-[#C75E4B]"
                            : insightIsStrength
                              ? "bg-[#DDF3EC] text-[#168F7F]"
                              : "bg-[#E4EDF2] text-[#183B4E]"
                        }`}
                      >
                        <Icon
                          name={
                            insightIsAttention
                              ? "warning"
                              : insightIsStrength
                                ? "check"
                                : "insight"
                          }
                          size={19}
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#7C8A90]">
                            Qué merece atención
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.09em] ${confidenceClass(
                              insight.confidence
                            )}`}
                          >
                            Confianza{" "}
                            {confidenceLabel(
                              insight.confidence
                            )}
                          </span>
                        </div>

                        <h3 className="mt-1.5 text-xl font-semibold tracking-[-0.035em] text-[#183B4E] sm:text-2xl">
                          {
                            insight.title
                          }
                        </h3>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65767D]">
                          {
                            insight.description
                          }
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 lg:min-w-[210px]">
                      <p
                        className={`text-3xl font-semibold tracking-[-0.05em] ${
                          insightIsAttention
                            ? "text-[#C75E4B]"
                            : insightIsStrength
                              ? "text-[#168F7F]"
                              : "text-[#183B4E]"
                        }`}
                      >
                        {
                          insight.metric
                        }
                      </p>

                      <p className="mt-1 text-xs font-medium text-[#7A888E]">
                        {
                          insight.supporting
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* =================================================
                DECISION METRICS
               ================================================= */}

            <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              {/* SCANS */}

              <div className="rounded-[21px] border border-[#DEE5E1] bg-white p-5 shadow-[0_3px_12px_rgba(24,59,78,0.025)]">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#E8F0F4] text-[#183B4E]">
                    <Icon
                      name="scan"
                      size={17}
                    />
                  </div>

                  <span className="rounded-full bg-[#F2F5F2] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#7C8A90]">
                    Actividad
                  </span>
                </div>

                <p className="mt-6 text-[30px] font-semibold tracking-[-0.05em] text-[#183B4E]">
                  {formatNumber(
                    analytics.periodScans.length
                  )}
                </p>

                <p className="mt-1 text-xs text-[#718087]">
                  escaneos en el período
                </p>

                {analytics.scanChange !==
                  null && (
                  <p
                    className={`mt-3 text-[10px] font-semibold ${
                      analytics.scanChange >=
                      0
                        ? "text-[#168F7F]"
                        : "text-[#C75E4B]"
                    }`}
                  >
                    {analytics.scanChange >=
                    0
                      ? "+"
                      : ""}
                    {
                      analytics.scanChange
                    }
                    % vs. período anterior
                  </p>
                )}
              </div>

              {/* CONVERSION */}

              <div className="rounded-[21px] border border-[#DEE5E1] bg-white p-5 shadow-[0_3px_12px_rgba(24,59,78,0.025)]">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#E3F5F0] text-[#168F7F]">
                    <Icon
                      name="target"
                      size={17}
                    />
                  </div>

                  <span className="rounded-full bg-[#F2F5F2] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#7C8A90]">
                    Respuesta
                  </span>
                </div>

                <p className="mt-6 text-[30px] font-semibold tracking-[-0.05em] text-[#183B4E]">
                  {analytics.conversion !==
                  null
                    ? `${analytics.conversion}%`
                    : "—"}
                </p>

                <p className="mt-1 text-xs text-[#718087]">
                  escaneo → valoración
                </p>

                {analytics.conversionChange !==
                  null && (
                  <p
                    className={`mt-3 text-[10px] font-semibold ${
                      analytics.conversionChange >=
                      0
                        ? "text-[#168F7F]"
                        : "text-[#C75E4B]"
                    }`}
                  >
                    {analytics.conversionChange >=
                    0
                      ? "+"
                      : ""}
                    {
                      analytics.conversionChange
                    } puntos
                  </p>
                )}
              </div>

              {/* CRITICAL */}

              <div className="rounded-[21px] border border-[#DEE5E1] bg-white p-5 shadow-[0_3px_12px_rgba(24,59,78,0.025)]">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#FBE8E3] text-[#C75E4B]">
                    <Icon
                      name="warning"
                      size={17}
                    />
                  </div>

                  <span className="rounded-full bg-[#F2F5F2] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#7C8A90]">
                    Atención
                  </span>
                </div>

                <p className="mt-6 text-[30px] font-semibold tracking-[-0.05em] text-[#183B4E]">
                  {
                    analytics.criticalPercentage
                  }
                  %
                </p>

                <p className="mt-1 text-xs text-[#718087]">
                  valoraciones de 1–2 estrellas
                </p>

                <p className="mt-3 text-[10px] font-semibold text-[#C75E4B]">
                  {formatNumber(
                    analytics.criticalCount
                  )}{" "}
                  respuestas
                </p>
              </div>

              {/* COMMENTS */}

              <div className="rounded-[21px] border border-[#DEE5E1] bg-white p-5 shadow-[0_3px_12px_rgba(24,59,78,0.025)]">
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#E8F0F4] text-[#183B4E]">
                    <Icon
                      name="comment"
                      size={17}
                    />
                  </div>

                  <span className="rounded-full bg-[#F2F5F2] px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.1em] text-[#7C8A90]">
                    Contexto
                  </span>
                </div>

                <p className="mt-6 text-[30px] font-semibold tracking-[-0.05em] text-[#183B4E]">
                  {formatNumber(
                    analytics.comments.length
                  )}
                </p>

                <p className="mt-1 text-xs text-[#718087]">
                  comentarios en el período
                </p>

                <p className="mt-3 text-[10px] font-semibold text-[#53656C]">
                  {analytics.periodFeedback.length >
                  0
                    ? Math.round(
                        (analytics.comments.length /
                          analytics.periodFeedback
                            .length) *
                          100
                      )
                    : 0}
                  % de las respuestas
                </p>
              </div>
            </section>

            {/* =================================================
                SATISFACTION TREND
               ================================================= */}

            <section className="mt-5 rounded-[25px] border border-[#DEE5E1] bg-white p-6 shadow-[0_4px_18px_rgba(24,59,78,0.025)] sm:p-7">
              <SectionHeader
                eyebrow="Evolución"
                title="¿La experiencia está mejorando o empeorando?"
                description="Mostramos el promedio diario únicamente cuando existen valoraciones ese día."
                action={
                  <div className="flex items-center gap-2 rounded-[12px] bg-[#F5F8F5] px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-[#25B7A4]" />

                    <span className="text-[10px] font-semibold text-[#63747A]">
                      Satisfacción
                    </span>
                  </div>
                }
              />

              {analytics.daily.filter(
                (day) =>
                  day.average !==
                  null
              ).length < 2 ? (
                <div className="mt-7 rounded-[20px] border border-dashed border-[#D6E0DA] bg-[#F8FAF8] px-6 py-10 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#168F7F] ring-1 ring-[#E1E8E3]">
                    <Icon
                      name="activity"
                      size={18}
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold text-[#183B4E]">
                    Todavía no hay suficiente historial para mostrar una tendencia.
                  </p>

                  <p className="mx-auto mt-1.5 max-w-lg text-xs leading-5 text-[#7A888E]">
                    Necesitamos al menos dos días con valoraciones para dibujar una evolución que no resulte engañosa.
                  </p>
                </div>
              ) : (
                <div className="mt-7 overflow-hidden rounded-[20px] bg-[#F8FAF8] p-3 sm:p-4">
                  <svg
                    viewBox="0 0 900 310"
                    className="h-[270px] w-full sm:h-[310px]"
                    role="img"
                    aria-label="Evolución de la satisfacción"
                  >
                    {[1, 2, 3, 4, 5].map(
                      (value) => {
                        const y =
                          240 -
                          ((value -
                            1) /
                            4) *
                            190;

                        return (
                          <g
                            key={
                              value
                            }
                          >
                            <line
                              x1="52"
                              x2="860"
                              y1={y}
                              y2={y}
                              stroke="#DDE5E0"
                              strokeWidth="1"
                            />

                            <text
                              x="12"
                              y={
                                y +
                                4
                              }
                              fontSize="10"
                              fill="#89969B"
                            >
                              {value}
                            </text>
                          </g>
                        );
                      }
                    )}

                    {analytics.daily.map(
                      (
                        day,
                        index
                      ) => {
                        const x =
                          58 +
                          (index /
                            Math.max(
                              analytics.daily
                                .length -
                                1,
                              1
                            )) *
                            800;

                        return (
                          <text
                            key={
                              day.key
                            }
                            x={x}
                            y="278"
                            textAnchor="middle"
                            fontSize="9"
                            fill="#8B989D"
                          >
                            {day.label}
                          </text>
                        );
                      }
                    )}

                    {analytics.daily
                      .filter(
                        (
                          day
                        ) =>
                          day.average !==
                          null
                      )
                      .map(
                        (
                          day,
                          index
                        ) => {
                          const originalIndex =
                            analytics.daily.findIndex(
                              (
                                item
                              ) =>
                                item.key ===
                                day.key
                            );

                          const x =
                            58 +
                            (originalIndex /
                              Math.max(
                                analytics.daily
                                  .length -
                                  1,
                                1
                              )) *
                              800;

                          const y =
                            240 -
                            ((day.average! -
                              1) /
                              4) *
                              190;

                          return (
                            <g
                              key={
                                `${day.key}-${index}`
                              }
                            >
                              <circle
                                cx={x}
                                cy={y}
                                r="5.5"
                                fill="white"
                                stroke="#25B7A4"
                                strokeWidth="3"
                              />

                              <text
                                x={x}
                                y={
                                  y -
                                  12
                                }
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="600"
                                fill="#183B4E"
                              >
                                {day.average!.toFixed(
                                  1
                                )}
                              </text>
                            </g>
                          );
                        }
                      )}

                    {analytics.daily.filter(
                      (
                        day
                      ) =>
                        day.average !==
                        null
                    ).length >
                      1 && (
                      <polyline
                        points={analytics.daily
                          .map(
                            (
                              day,
                              index
                            ) => {
                              if (
                                day.average ===
                                null
                              ) {
                                return null;
                              }

                              const x =
                                58 +
                                (index /
                                  Math.max(
                                    analytics.daily
                                      .length -
                                      1,
                                    1
                                  )) *
                                  800;

                              const y =
                                240 -
                                ((day.average -
                                  1) /
                                  4) *
                                  190;

                              return `${x},${y}`;
                            }
                          )
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          )}
                        fill="none"
                        stroke="#25B7A4"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </div>
              )}
            </section>

            {/* =================================================
                ACTIVITY + CONVERSION
               ================================================= */}

            <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">

              {/* ACTIVITY */}

              <div className="rounded-[25px] border border-[#DEE5E1] bg-white p-6 shadow-[0_4px_18px_rgba(24,59,78,0.025)] sm:p-7">
                <SectionHeader
                  eyebrow="Actividad"
                  title="Cuándo están interactuando tus clientes."
                  description="Escaneos registrados por GuestTap."
                />

                <div className="mt-7 flex items-end justify-between">
                  <div>
                    <p className="text-[42px] font-semibold leading-none tracking-[-0.065em] text-[#183B4E]">
                      {formatNumber(
                        analytics.periodScans.length
                      )}
                    </p>

                    <p className="mt-2 text-xs text-[#7A888E]">
                      escaneos
                    </p>
                  </div>

                  {analytics.scanChange !==
                    null && (
                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
                        analytics.scanChange >=
                        0
                          ? "bg-[#E3F5F0] text-[#168F7F]"
                          : "bg-[#FBE8E3] text-[#C75E4B]"
                      }`}
                    >
                      {analytics.scanChange >=
                      0
                        ? "+"
                        : ""}
                      {
                        analytics.scanChange
                      }%
                    </span>
                  )}
                </div>

                <div className="mt-8 flex h-[170px] items-end gap-1.5 sm:gap-2">
                  {analytics.daily.map(
                    (day) => {
                      const maxScans =
                        Math.max(
                          ...analytics.daily.map(
                            (
                              item
                            ) =>
                              item.scans
                          ),
                          1
                        );

                      const height =
                        day.scans === 0
                          ? 7
                          : Math.max(
                              18,
                              (day.scans /
                                maxScans) *
                                125
                            );

                      return (
                        <div
                          key={
                            day.key
                          }
                          className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                        >
                          <span className="text-[8px] font-semibold text-[#7C8A90]">
                            {day.scans}
                          </span>

                          <div
                            className={`w-full max-w-[34px] rounded-[7px] ${
                              day.scans >
                              0
                                ? "bg-[#183B4E]"
                                : "bg-[#E5EBE7]"
                            }`}
                            style={{
                              height: `${height}px`,
                            }}
                          />

                          <span className="max-w-full truncate text-[8px] text-[#8A979C]">
                            {day.label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* CONVERSION */}

              <div className="rounded-[25px] border border-[#DEE5E1] bg-white p-6 shadow-[0_4px_18px_rgba(24,59,78,0.025)] sm:p-7">
                <SectionHeader
                  eyebrow="Conversión"
                  title="Del escaneo a la valoración."
                  description="Qué parte de las interacciones terminó en una respuesta atribuible."
                />

                <div className="mt-7 flex items-center gap-6">
                  <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
                    <svg
                      viewBox="0 0 120 120"
                      className="-rotate-90"
                    >
                      <circle
                        cx="60"
                        cy="60"
                        r="49"
                        fill="none"
                        stroke="#E5EBE7"
                        strokeWidth="10"
                      />

                      <circle
                        cx="60"
                        cy="60"
                        r="49"
                        fill="none"
                        stroke="#25B7A4"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(
                          analytics.conversion ??
                            0,
                          100
                        ) * 3.078} 307.8`}
                      />
                    </svg>

                    <div className="absolute text-center">
                      <p className="text-3xl font-semibold tracking-[-0.06em] text-[#183B4E]">
                        {analytics.conversion !==
                        null
                          ? `${analytics.conversion}%`
                          : "—"}
                      </p>

                      <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-[#839096]">
                        conversión
                      </p>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-[#718087]">
                        Escaneos
                      </span>

                      <span className="text-sm font-semibold text-[#183B4E]">
                        {formatNumber(
                          analytics.periodScans.length
                        )}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-xs text-[#718087]">
                        Valoraciones atribuibles
                      </span>

                      <span className="text-sm font-semibold text-[#183B4E]">
                        {formatNumber(
                          analytics.convertedScans
                        )}
                      </span>
                    </div>

                    <div className="mt-5 border-t border-[#E7ECE8] pt-4">
                      <p className="text-[10px] leading-5 text-[#7C8A90]">
                        Solo contamos una conversión cuando la valoración tiene asociado un `scan_event_id`.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                CHANNELS
               ================================================= */}

            <section className="mt-5 rounded-[25px] border border-[#DEE5E1] bg-white p-6 shadow-[0_4px_18px_rgba(24,59,78,0.025)] sm:p-7">
              <SectionHeader
                eyebrow="Canales"
                title="Cómo llegan tus clientes."
                description="Distribución de las interacciones registradas."
              />

              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div className="rounded-[19px] bg-[#F8FAF8] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#E8F0F4] text-[#183B4E]">
                        <Icon
                          name="qr"
                          size={17}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#183B4E]">
                          QR
                        </p>

                        <p className="text-[10px] text-[#819097]">
                          Código QR
                        </p>
                      </div>
                    </div>

                    <span className="text-xl font-semibold tracking-[-0.04em] text-[#183B4E]">
                      {formatNumber(
                        analytics.qrScans
                      )}
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5EBE7]">
                    <div
                      className="h-full rounded-full bg-[#183B4E]"
                      style={{
                        width:
                          analytics.periodScans.length >
                          0
                            ? `${
                                (analytics.qrScans /
                                  analytics.periodScans
                                    .length) *
                                100
                              }%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>

                <div className="rounded-[19px] bg-[#F8FAF8] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#E3F5F0] text-[#168F7F]">
                        <Icon
                          name="nfc"
                          size={17}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#183B4E]">
                          NFC
                        </p>

                        <p className="text-[10px] text-[#819097]">
                          Etiqueta NFC
                        </p>
                      </div>
                    </div>

                    <span className="text-xl font-semibold tracking-[-0.04em] text-[#183B4E]">
                      {formatNumber(
                        analytics.nfcScans
                      )}
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5EBE7]">
                    <div
                      className="h-full rounded-full bg-[#25B7A4]"
                      style={{
                        width:
                          analytics.periodScans.length >
                          0
                            ? `${
                                (analytics.nfcScans /
                                  analytics.periodScans
                                    .length) *
                                100
                              }%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                INTELLIGENCE
               ================================================= */}

            <section className="mt-5 overflow-hidden rounded-[27px] border border-[#D8E3DD] bg-[#F2F8F5]">
              <div className="border-b border-[#DCE7E0] px-6 py-6 sm:px-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[#183B4E] text-white">
                    <Icon
                      name="spark"
                      size={16}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#63767D]">
                      GuestTap Intelligence
                    </p>

                    <h3 className="mt-1.5 text-[23px] font-semibold tracking-[-0.04em] text-[#183B4E]">
                      Lo que aparece detrás de los comentarios.
                    </h3>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-[#708087]">
                      Agrupamos comentarios por temas y mostramos la evidencia que respalda cada señal.
                    </p>
                  </div>
                </div>
              </div>

              {serverIntelligence?.primaryInsight && (
                <div className="mx-6 mt-6 rounded-[21px] border border-[#D6E5DF] bg-white p-5 sm:mx-7">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${
                        serverIntelligence.primaryInsight.type ===
                        "attention"
                          ? "bg-[#FBE8E3] text-[#C75E4B]"
                          : serverIntelligence.primaryInsight.type ===
                              "strength"
                            ? "bg-[#E3F5F0] text-[#168F7F]"
                            : "bg-[#E8F0F4] text-[#183B4E]"
                      }`}
                    >
                      <Icon
                        name="spark"
                        size={17}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6E8086]">
                        Señal detectada por GuestTap
                      </p>

                      <h4 className="mt-1.5 text-[18px] font-semibold tracking-[-0.025em] text-[#183B4E]">
                        {serverIntelligence.primaryInsight.title}
                      </h4>

                      <p className="mt-2 text-xs leading-5 text-[#718087]">
                        {serverIntelligence.primaryInsight.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#F4F7F4] px-3 py-1.5 text-[10px] font-semibold text-[#53656C]">
                          {serverIntelligence.primaryInsight.metric}
                        </span>

                        <span className="rounded-full bg-[#F4F7F4] px-3 py-1.5 text-[10px] font-semibold text-[#53656C]">
                          {serverIntelligence.primaryInsight.supporting}
                        </span>

                        <span className="rounded-full bg-[#E3F5F0] px-3 py-1.5 text-[10px] font-semibold text-[#168F7F]">
                          Confianza{" "}
                          {Math.round(
                            serverIntelligence.primaryInsight
                              .confidence * 100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {analytics.topicSignals.length ===
              0 ? (
                <div className="p-6 sm:p-7">
                  <div className="rounded-[21px] border border-dashed border-[#CBD9D1] bg-white/70 px-6 py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#E5F1EB] text-[#168F7F]">
                      <Icon
                        name="spark"
                        size={20}
                      />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-[#183B4E]">
                      Todavía no aparece un tema claro.
                    </p>

                    <p className="mx-auto mt-1.5 max-w-lg text-xs leading-5 text-[#74838A]">
                      Cuando los comentarios contengan suficiente información relacionada con un mismo tema, GuestTap podrá mostrarlo acá.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 p-6 sm:p-7 lg:grid-cols-2">
                  {analytics.topicSignals
                    .sort(
                      (a, b) => {
                        if (
                          a.sentiment ===
                            "attention" &&
                          b.sentiment !==
                            "attention"
                        ) {
                          return -1;
                        }

                        if (
                          a.sentiment !==
                            "attention" &&
                          b.sentiment ===
                            "attention"
                        ) {
                          return 1;
                        }

                        return (
                          b.count -
                          a.count
                        );
                      }
                    )
                    .map(
                      (signal) => {
                        const attention =
                          signal.sentiment ===
                          "attention";

                        const positive =
                          signal.sentiment ===
                          "positive";

                        return (
                          <button
                            key={
                              signal.key
                            }
                            type="button"
                            onClick={() =>
                              setSelectedTopic(
                                signal
                              )
                            }
                            className="group text-left"
                          >
                            <div
                              className={`h-full rounded-[21px] border bg-white p-5 transition group-hover:-translate-y-0.5 group-hover:shadow-[0_9px_25px_rgba(24,59,78,0.07)] ${
                                attention
                                  ? "border-[#F0D5CE]"
                                  : positive
                                    ? "border-[#CFE8E1]"
                                    : "border-[#DEE6E1]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${
                                      attention
                                        ? "bg-[#FBE8E3] text-[#C75E4B]"
                                        : positive
                                          ? "bg-[#E3F5F0] text-[#168F7F]"
                                          : "bg-[#E8F0F4] text-[#183B4E]"
                                    }`}
                                  >
                                    <Icon
                                      name={
                                        attention
                                          ? "warning"
                                          : positive
                                            ? "check"
                                            : "insight"
                                      }
                                      size={
                                        17
                                      }
                                    />
                                  </div>

                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#849198]">
                                        {attention
                                          ? "Punto de atención"
                                          : positive
                                            ? "Fortaleza"
                                            : "Tema"}
                                      </p>

                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.08em] ${confidenceClass(
                                          signal.confidence
                                        )}`}
                                      >
                                        {
                                          confidenceLabel(
                                            signal.confidence
                                          )
                                        }
                                      </span>
                                    </div>

                                    <h4 className="mt-1 text-base font-semibold tracking-[-0.025em] text-[#183B4E]">
                                      {
                                        signal.title
                                      }
                                    </h4>
                                  </div>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-bold ${
                                    attention
                                      ? "bg-[#FBE8E3] text-[#C75E4B]"
                                      : positive
                                        ? "bg-[#E3F5F0] text-[#168F7F]"
                                        : "bg-[#F0F3F0] text-[#68787F]"
                                  }`}
                                >
                                  {
                                    signal.count
                                  }{" "}
                                  {signal.count ===
                                  1
                                    ? "mención"
                                    : "menciones"}
                                </span>
                              </div>

                              <p className="mt-4 text-xs leading-5 text-[#718087]">
                                {
                                  signal.description
                                }
                              </p>

                              <div className="mt-5 flex items-end justify-between border-t border-[#E8ECE8] pt-4">
                                <div>
                                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#89959A]">
                                    Evidencia
                                  </p>

                                  <div className="mt-1.5 flex items-center gap-2">
                                    <Stars
                                      rating={Math.round(
                                        signal.averageRating
                                      )}
                                    />

                                    <span className="text-xs font-semibold text-[#183B4E]">
                                      {
                                        signal.averageRating
                                      }
                                    </span>
                                  </div>
                                </div>

                                <span className="flex items-center gap-1 text-[9px] font-semibold text-[#718087]">
                                  Ver comentarios
                                  <Icon
                                    name="arrow"
                                    size={11}
                                  />
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                </div>
              )}

              <div className="border-t border-[#DCE7E0] px-6 py-4 sm:px-7">
                <div className="flex items-start gap-2">
                  <Icon
                    name="info"
                    size={13}
                  />

                  <p className="text-[9px] leading-5 text-[#7A888E]">
                    Las señales de esta sección se construyen a partir de coincidencias de temas en comentarios reales. No son diagnósticos ni conclusiones causales.
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================
                VOICE OF CUSTOMER
               ================================================= */}

            <section className="mt-5 rounded-[25px] border border-[#DEE5E1] bg-white shadow-[0_4px_18px_rgba(24,59,78,0.025)]">
              <div className="border-b border-[#E5EAE6] p-6 sm:p-7">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#7C8A90]">
                      Voz del cliente
                    </p>

                    <h3 className="mt-1.5 text-[20px] font-semibold tracking-[-0.03em] text-[#183B4E]">
                      Lo que realmente dijeron.
                    </h3>

                    <p className="mt-1.5 text-xs leading-5 text-[#718087]">
                      Los comentarios son la evidencia detrás de las señales.
                    </p>
                  </div>

                  <div className="flex items-center gap-1 rounded-[12px] border border-[#DDE4E0] bg-[#F8FAF8] p-1">
                    {(
                      [
                        [
                          "all",
                          "Todos",
                        ],
                        [
                          "positive",
                          "Positivos",
                        ],
                        [
                          "critical",
                          "Críticos",
                        ],
                      ] as [
                        CommentFilter,
                        string
                      ][]
                    ).map(
                      ([
                        key,
                        label,
                      ]) => {
                        const active =
                          commentFilter ===
                          key;

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              setCommentFilter(
                                key
                              );
                              setShowAllComments(
                                false
                              );
                            }}
                            className={`rounded-[9px] px-3 py-1.5 text-[9px] font-semibold transition ${
                              active
                                ? "bg-[#183B4E] text-white"
                                : "text-[#718087] hover:bg-white"
                            }`}
                          >
                            {
                              label
                            }
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {filteredComments.length ===
              0 ? (
                <div className="p-7">
                  <div className="rounded-[20px] bg-[#F8FAF8] px-6 py-10 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#7C8A90] ring-1 ring-[#E1E7E2]">
                      <Icon
                        name="comment"
                        size={17}
                      />
                    </div>

                    <p className="mt-4 text-sm font-semibold text-[#183B4E]">
                      No hay comentarios en este filtro.
                    </p>

                    <p className="mt-1.5 text-xs text-[#7B898F]">
                      Cuando existan, aparecerán acá.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-3 p-6 sm:p-7 lg:grid-cols-2">
                    {filteredComments.map(
                      (item) => {
                        const critical =
                          item.rating <= 2;

                        return (
                          <article
                            key={
                              item.id
                            }
                            className={`rounded-[20px] border p-5 ${
                              critical
                                ? "border-[#F0D8D1] bg-[#FFFAF8]"
                                : "border-[#E3E9E4] bg-[#FAFBFA]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Stars
                                  rating={
                                    item.rating
                                  }
                                  size="medium"
                                />

                                <span
                                  className={`text-[9px] font-semibold ${
                                    critical
                                      ? "text-[#C75E4B]"
                                      : "text-[#168F7F]"
                                  }`}
                                >
                                  {ratingLabel(
                                    item.rating
                                  )}
                                </span>
                              </div>

                              <span className="shrink-0 text-[9px] text-[#8A979C]">
                                {formatDate(
                                  item.created_at
                                )}
                              </span>
                            </div>

                            <p className="mt-4 text-sm leading-6 text-[#53656C]">
                              “
                              {
                                item.message
                              }
                              ”
                            </p>

                            <div className="mt-5 flex items-center justify-between border-t border-[#E7ECE8] pt-3">
                              <span className="text-[8px] font-bold uppercase tracking-[0.11em] text-[#89959A]">
                                Valoración{" "}
                                {
                                  item.rating
                                }
                                /5
                              </span>

                              <span className="text-[9px] text-[#89959A]">
                                {formatLongDate(
                                  item.created_at
                                )}
                              </span>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>

                  {analytics.comments.length >
                    6 && (
                    <div className="border-t border-[#E5EAE6] px-6 py-5 text-center sm:px-7">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAllComments(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-[12px] border border-[#DDE4E0] bg-white px-4 py-2.5 text-[10px] font-semibold text-[#53656C] transition hover:bg-[#F7F9F7]"
                      >
                        {showAllComments
                          ? "Mostrar menos"
                          : `Ver todos los comentarios (${analytics.comments.length})`}

                        <Icon
                          name="arrow"
                          size={12}
                        />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* =================================================
                RATINGS + CHANNEL HEALTH
               ================================================= */}

            <section className="mt-5 grid gap-5 lg:grid-cols-2">

              {/* DISTRIBUTION */}

              <div className="rounded-[25px] border border-[#DEE5E1] bg-white p-6 shadow-[0_4px_18px_rgba(24,59,78,0.025)] sm:p-7">
                <SectionHeader
                  eyebrow="Valoraciones"
                  title="Dónde se concentra la satisfacción."
                  description="Distribución completa de las respuestas del período."
                />

                <div className="mt-8 space-y-3.5">
                  {analytics.ratingDistribution.map(
                    (item) => (
                      <div
                        key={
                          item.rating
                        }
                        className="flex items-center gap-3"
                      >
                        <div className="flex w-10 items-center gap-1">
                          <span className="text-xs font-semibold text-[#53656C]">
                            {
                              item.rating
                            }
                          </span>

                          <span className="text-[11px] text-[#E2A93B]">
                            ★
                          </span>
                        </div>

                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E8EDE9]">
                          <div
                            className={`h-full rounded-full ${
                              item.rating >=
                              4
                                ? "bg-[#25B7A4]"
                                : item.rating ===
                                    3
                                  ? "bg-[#9DA8AC]"
                                  : "bg-[#E97862]"
                            }`}
                            style={{
                              width: `${item.percentage}%`,
                            }}
                          />
                        </div>

                        <span className="w-10 text-right text-xs font-semibold text-[#53656C]">
                          {
                            item.count
                          }
                        </span>

                        <span className="w-10 text-right text-[9px] text-[#89959A]">
                          {
                            item.percentage
                          }
                          %
                        </span>
                      </div>
                    )
                  )}
                </div>

                <div className="mt-7 rounded-[17px] bg-[#F7F9F7] p-4">
                  <p className="text-[10px] leading-5 text-[#718087]">
                    {formatNumber(
                      analytics.periodFeedback.length
                    )}{" "}
                    respuestas forman esta distribución.
                  </p>
                </div>
              </div>

              {/* DATA QUALITY */}

              <div className="rounded-[25px] border border-[#DEE5E1] bg-white p-6 shadow-[0_4px_18px_rgba(24,59,78,0.025)] sm:p-7">
                <SectionHeader
                  eyebrow="Calidad del dato"
                  title="Qué tan completa es la información."
                  description="Transparencia sobre qué puede y qué no puede inferir GuestTap."
                />

                <div className="mt-7 space-y-3">
                  <div className="flex items-center justify-between rounded-[17px] bg-[#F7F9F7] p-4">
                    <div>
                      <p className="text-xs font-semibold text-[#183B4E]">
                        Valoraciones
                      </p>

                      <p className="mt-1 text-[10px] text-[#7C8A90]">
                        Respuestas recibidas
                      </p>
                    </div>

                    <span className="text-lg font-semibold text-[#183B4E]">
                      {formatNumber(
                        analytics.periodFeedback.length
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[17px] bg-[#F7F9F7] p-4">
                    <div>
                      <p className="text-xs font-semibold text-[#183B4E]">
                        Con atribución
                      </p>

                      <p className="mt-1 text-[10px] text-[#7C8A90]">
                        Con scan asociado
                      </p>
                    </div>

                    <span className="text-lg font-semibold text-[#168F7F]">
                      {formatNumber(
                        analytics.attributableFeedback
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-[17px] bg-[#F7F9F7] p-4">
                    <div>
                      <p className="text-xs font-semibold text-[#183B4E]">
                        Sin atribución
                      </p>

                      <p className="mt-1 text-[10px] text-[#7C8A90]">
                        No se puede conectar con un escaneo
                      </p>
                    </div>

                    <span className="text-lg font-semibold text-[#53656C]">
                      {formatNumber(
                        analytics.unattributedFeedback
                      )}
                    </span>
                  </div>

                  <div className="mt-5 rounded-[17px] border border-[#DDE6E0] bg-[#F5FAF7] p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 text-[#168F7F]">
                        <Icon
                          name="info"
                          size={14}
                        />
                      </div>

                      <p className="text-[10px] leading-5 text-[#6E7E84]">
                        GuestTap no usa valoraciones sin evidencia para calcular conversiones de escaneo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                TODAY
               ================================================= */}

            <section className="mt-5 grid gap-5 md:grid-cols-3">

              <div className="rounded-[21px] border border-[#DEE5E1] bg-white p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#E8F0F4] text-[#183B4E]">
                  <Icon
                    name="calendar"
                    size={16}
                  />
                </div>

                <p className="mt-5 text-[27px] font-semibold tracking-[-0.05em] text-[#183B4E]">
                  {formatNumber(
                    analytics.scansToday
                  )}
                </p>

                <p className="mt-1 text-xs text-[#718087]">
                  escaneos hoy
                </p>
              </div>

              <div className="rounded-[21px] border border-[#DEE5E1] bg-white p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#E3F5F0] text-[#168F7F]">
                  <Icon
                    name="comment"
                    size={16}
                  />
                </div>

                <p className="mt-5 text-[27px] font-semibold tracking-[-0.05em] text-[#183B4E]">
                  {formatNumber(
                    analytics.comments.length
                  )}
                </p>

                <p className="mt-1 text-xs text-[#718087]">
                  comentarios con contexto
                </p>
              </div>

              <div className="rounded-[21px] border border-[#DEE5E1] bg-white p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#FBE8E3] text-[#C75E4B]">
                  <Icon
                    name="warning"
                    size={16}
                  />
                </div>

                <p className="mt-5 text-[27px] font-semibold tracking-[-0.05em] text-[#183B4E]">
                  {
                    analytics.criticalCount
                  }
                </p>

                <p className="mt-1 text-xs text-[#718087]">
                  valoraciones críticas
                </p>
              </div>
            </section>

            {/* =================================================
                FINAL INTERPRETATION
               ================================================= */}

            <section className="mt-5 overflow-hidden rounded-[25px] border border-[#DCE5DF] bg-[#F3F8F5]">
              <div className="p-6 sm:p-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#183B4E] text-white">
                    <Icon
                      name="insight"
                      size={17}
                    />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#6E8086]">
                      Cómo leer este panel
                    </p>

                    <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.025em] text-[#183B4E]">
                      Datos primero. Interpretación después.
                    </h3>

                    <p className="mt-2 max-w-3xl text-xs leading-5 text-[#718087]">
                      GuestTap diferencia entre lo que sabemos directamente, las señales que aparecen en los datos y las conclusiones que todavía requieren más evidencia. Cuando no hay suficiente información, el sistema lo muestra en lugar de completar el vacío con una suposición.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                FOOTER
               ================================================= */}

            <footer className="mt-8 flex flex-col gap-2 border-t border-[#E1E6E2] pt-6 text-[9px] text-[#89959A] sm:flex-row sm:items-center sm:justify-between">
              <p>
                GuestTap · Customer Experience Intelligence
              </p>

              <p>
                {formatNumber(
                  analytics.totalFeedback
                )}{" "}
                valoraciones históricas ·{" "}
                {formatNumber(
                  analytics.totalScans
                )}{" "}
                escaneos históricos
              </p>
            </footer>
          </div>
        </div>
      </div>

      {/* =====================================================
          TOPIC EVIDENCE MODAL
         ===================================================== */}

      {selectedTopic && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#183B4E]/35 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedTopic(null)
          }
        >
          <div
            className="w-full max-w-xl overflow-hidden rounded-[27px] border border-[#DCE5DF] bg-white shadow-[0_25px_90px_rgba(24,59,78,0.22)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="border-b border-[#E5EAE6] p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${
                      selectedTopic.sentiment ===
                      "attention"
                        ? "bg-[#FBE8E3] text-[#C75E4B]"
                        : selectedTopic.sentiment ===
                            "positive"
                          ? "bg-[#E3F5F0] text-[#168F7F]"
                          : "bg-[#E8F0F4] text-[#183B4E]"
                    }`}
                  >
                    <Icon
                      name={
                        selectedTopic.sentiment ===
                        "attention"
                          ? "warning"
                          : selectedTopic.sentiment ===
                              "positive"
                            ? "check"
                            : "insight"
                      }
                      size={18}
                    />
                  </div>

                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#849198]">
                      Evidencia de GuestTap
                    </p>

                    <h3 className="mt-1 text-xl font-semibold tracking-[-0.035em] text-[#183B4E]">
                      {
                        selectedTopic.title
                      }
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedTopic(
                      null
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#F3F6F3] text-[#718087] transition hover:bg-[#E9EEEA]"
                >
                  <Icon
                    name="x"
                    size={15}
                  />
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2.5">
                <div className="rounded-[15px] bg-[#F7F9F7] p-3.5">
                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#849198]">
                    Menciones
                  </p>

                  <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-[#183B4E]">
                    {
                      selectedTopic.count
                    }
                  </p>
                </div>

                <div className="rounded-[15px] bg-[#F7F9F7] p-3.5">
                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#849198]">
                    Promedio
                  </p>

                  <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-[#183B4E]">
                    {
                      selectedTopic.averageRating
                    }
                  </p>
                </div>

                <div className="rounded-[15px] bg-[#F7F9F7] p-3.5">
                  <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#849198]">
                    Críticas
                  </p>

                  <p className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-[#C75E4B]">
                    {
                      selectedTopic.criticalCount
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <p className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#849198]">
                  Comentarios encontrados
                </p>

                <span
                  className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${confidenceClass(
                    selectedTopic.confidence
                  )}`}
                >
                  Confianza{" "}
                  {confidenceLabel(
                    selectedTopic.confidence
                  )}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {selectedTopic.evidence.map(
                  (item) => (
                    <div
                      key={
                        item.id
                      }
                      className="rounded-[18px] border border-[#E3E9E4] bg-[#FAFBFA] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Stars
                          rating={
                            item.rating
                          }
                          size="medium"
                        />

                        <span className="text-[9px] text-[#8A979C]">
                          {formatDate(
                            item.created_at
                          )}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-[#53656C]">
                        “
                        {
                          item.message
                        }
                        ”
                      </p>
                    </div>
                  )
                )}
              </div>

              <div className="mt-5 rounded-[16px] bg-[#F6F9F6] p-4">
                <div className="flex items-start gap-2">
                  <Icon
                    name="info"
                    size={13}
                  />

                  <p className="text-[9px] leading-5 text-[#7B898F]">
                    GuestTap encontró este tema por coincidencias entre el texto de los comentarios. Una coincidencia no demuestra por sí sola que exista un problema causal o recurrente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}