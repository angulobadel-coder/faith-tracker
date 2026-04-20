import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Día de la semana en español (zona horaria America/Bogota)
function getDayInfo(date: Date) {
  const tz = "America/Bogota";
  const dayName = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    timeZone: tz,
  }).format(date);
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: tz,
  }).format(date); // YYYY-MM-DD
  const timeStr = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: tz,
  }).format(date);
  return { dayName, dateStr, timeStr };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/esp32-api/, "") || "/";

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // ── GET /status ──
    if (path === "/status" && req.method === "GET") {
      return json({ ok: true, timestamp: new Date().toISOString() });
    }

    // ── GET /members ── ESP32 fetches members with fingerprint_id
    if (path === "/members" && req.method === "GET") {
      const { data, error } = await supabase
        .from("members")
        .select("id, full_name, fingerprint_id")
        .eq("active", true)
        .not("fingerprint_id", "is", null)
        .order("fingerprint_id");
      if (error) return json({ error: error.message }, 500);
      return json(data);
    }

    // ── POST /attendance ── ESP32 sends { fingerprint_id, service_type? }
    // Cada marca queda registrada con fecha, día y hora (sin bloquear duplicados)
    if (path === "/attendance" && req.method === "POST") {
      const body = await req.json();
      const fingerprintId = String(body.fingerprint_id ?? "").trim();
      if (!fingerprintId) {
        return json({ error: "fingerprint_id is required" }, 400);
      }

      const { data: member, error: memberErr } = await supabase
        .from("members")
        .select("id, full_name")
        .eq("fingerprint_id", fingerprintId)
        .eq("active", true)
        .maybeSingle();

      if (memberErr) return json({ error: memberErr.message }, 500);
      if (!member) {
        return json(
          { error: "No member with that fingerprint_id", fingerprint_id: fingerprintId },
          404
        );
      }

      const now = new Date();
      const { dayName, dateStr, timeStr } = getDayInfo(now);
      const serviceType = body.service_type || `${dayName} ${timeStr}`;

      const { error: insertErr } = await supabase.from("attendance").insert({
        member_id: member.id,
        attendance_date: dateStr,
        service_type: serviceType,
      });

      if (insertErr) return json({ error: insertErr.message }, 500);

      return json({
        success: true,
        message: `Asistencia registrada: ${member.full_name}`,
        member_name: member.full_name,
        date: dateStr,
        day: dayName,
        time: timeStr,
      });
    }

    // ── GET /next-slot ── Returns next available fingerprint slot
    if (path === "/next-slot" && req.method === "GET") {
      const { data } = await supabase
        .from("members")
        .select("fingerprint_id")
        .not("fingerprint_id", "is", null);

      const usedSlots = (data || [])
        .map((m) => parseInt(m.fingerprint_id || "0"))
        .filter((n) => !isNaN(n) && n > 0);
      const nextSlot = usedSlots.length > 0 ? Math.max(...usedSlots) + 1 : 1;

      return json({ next_slot: nextSlot });
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    return json({ error: (err as Error).message || "Internal error" }, 500);
  }
});
