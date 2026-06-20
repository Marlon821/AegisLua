import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/admin";
import { listLogs, listScripts } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await listLogs();
  if (user.role === "owner" || user.role === "admin") {
    return NextResponse.json({ logs });
  }

  const ownScriptIds = new Set((await listScripts()).filter((script) => script.ownerId === user.id).flatMap((script) => [script.id, script.slug]));
  return NextResponse.json({ logs: logs.filter((log) => log.scriptId && ownScriptIds.has(log.scriptId)) });
}
