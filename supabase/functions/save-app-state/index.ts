declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => { shutdown: () => void };
  env: { get: (key: string) => string | undefined };
};
// @ts-expect-error - ESM URL import for Deno runtime
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface SavePayload {
  rooms?: Record<string, unknown>[];
  income_records?: Record<string, unknown>[];
  room_financials?: Record<string, unknown>[];
  partners?: Record<string, unknown>[];
  transactions?: Record<string, unknown>[];
  monthly_controls?: Record<string, unknown>[];
  forecast_records?: Record<string, unknown>[];
  expense_records?: Record<string, unknown>[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Set in Supabase Dashboard: Edge Function secrets / environment (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) {
    console.error("save-app-state: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const client = createClient(url, key);

  let payload: SavePayload;
  try {
    payload = (await req.json()) as SavePayload;
  } catch (e) {
    console.error("save-app-state: invalid JSON", e);
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    if (payload.rooms?.length) {
      const { error } = await client.from("rooms").upsert(payload.rooms, { onConflict: "id" });
      if (error) {
        console.error("save-app-state rooms failed:", error.message);
        throw error;
      }
    }
    if (payload.income_records?.length) {
      const { error } = await client.from("income_records").upsert(payload.income_records, { onConflict: "id" });
      if (error) {
        console.error("save-app-state income_records failed:", error.message);
        throw error;
      }
    }
    if (payload.room_financials?.length) {
      const { error } = await client.from("room_financials").upsert(payload.room_financials, { onConflict: "id" });
      if (error) {
        console.error("save-app-state room_financials failed:", error.message);
        throw error;
      }
    }
    if (payload.partners?.length) {
      const { error } = await client.from("partners").upsert(payload.partners, { onConflict: "id" });
      if (error) {
        console.error("save-app-state partners failed:", error.message);
        throw error;
      }
    }
    if (payload.transactions?.length) {
      const { error } = await client.from("transactions").upsert(payload.transactions, { onConflict: "id" });
      if (error) {
        console.error("save-app-state transactions failed:", error.message);
        throw error;
      }
    }
    if (payload.monthly_controls?.length) {
      const { error } = await client.from("monthly_controls").upsert(payload.monthly_controls, { onConflict: "month_key" });
      if (error) {
        console.error("save-app-state monthly_controls failed:", error.message);
        throw error;
      }
    }
    if (payload.forecast_records?.length) {
      const { error } = await client.from("forecast_records").upsert(payload.forecast_records, { onConflict: "id" });
      if (error) {
        console.error("save-app-state forecast_records failed:", error.message);
        throw error;
      }
    }
    if (payload.expense_records?.length) {
      const { error } = await client.from("expense_records").upsert(payload.expense_records, { onConflict: "id" });
      if (error) {
        console.error("save-app-state expense_records failed:", error.message);
        throw error;
      }
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("save-app-state failed:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
