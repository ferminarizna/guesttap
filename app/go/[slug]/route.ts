import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const PRODUCTION_URL = "https://guesttap-five.vercel.app";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (businessError || !business) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await supabase.rpc("registrar_scan", {
    p_business_id: business.id,
    p_source: "qr",
  });

  return NextResponse.redirect(`${PRODUCTION_URL}/${business.slug}`);
}