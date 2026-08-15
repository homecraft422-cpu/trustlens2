import { NextRequest, NextResponse } from "next/server";
import { getSessionUserFromToken } from "@/lib/auth";
import { config } from "@/lib/config";

interface ProviderHealth {
  name: string;
  configured: boolean;
  enabled: boolean;
  modalities: string[];
  status: "ready" | "not_configured" | "disabled" | "error";
  statusMessage: string;
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const user = token ? await getSessionUserFromToken(token) : null;

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const providers: ProviderHealth[] = [];

  // Hive
  const hiveConfigured = !!process.env.HIVE_API_KEY;
  const hiveEnabled = config.detection.mode === "production" && hiveConfigured;
  providers.push({
    name: "hive",
    configured: hiveConfigured,
    enabled: hiveEnabled,
    modalities: ["image", "video", "audio"],
    status: hiveEnabled ? "ready" : !hiveConfigured ? "not_configured" : "disabled",
    statusMessage: hiveEnabled
      ? "Provider configured and active"
      : !hiveConfigured
        ? "HIVE_API_KEY not set"
        : "Provider configured but DETECTION_MODE is not production",
  });

  // Sightengine
  const seConfigured = !!process.env.SIGHTENGINE_API_USER && !!process.env.SIGHTENGINE_API_SECRET;
  const seEnabled = config.detection.mode === "production" && seConfigured;
  providers.push({
    name: "sightengine",
    configured: seConfigured,
    enabled: seEnabled,
    modalities: ["image", "video"],
    status: seEnabled ? "ready" : !seConfigured ? "not_configured" : "disabled",
    statusMessage: seEnabled
      ? "Provider configured and active"
      : !seConfigured
        ? "SIGHTENGINE_API_USER or SIGHTENGINE_API_SECRET not set"
        : "Provider configured but DETECTION_MODE is not production",
  });

  // Local heuristic engine (active in mock/local mode)
  const localEnabled = config.detection.mode === "mock";
  providers.push({
    name: "local_heuristics",
    configured: true,
    enabled: localEnabled,
    modalities: ["image", "video", "audio"],
    status: localEnabled ? "ready" : "disabled",
    statusMessage: localEnabled
      ? "Built-in local engine active — deterministic metadata & statistical analysis (no neural models)"
      : "Local engine disabled in production mode",
  });

  const activeCount = providers.filter((p) => p.enabled).length;

  return NextResponse.json({
    mode: config.detection.mode,
    activeProviderCount: activeCount,
    providers,
    timestamp: new Date().toISOString(),
    // NEVER expose credentials
  });
}
