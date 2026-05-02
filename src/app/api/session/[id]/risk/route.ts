import { NextResponse } from "next/server";
import { getLiveRisk } from "@/lib/risk-engine";
import { validateParam } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const paramCheck = validateParam(rawId);
  if (!paramCheck.success) return paramCheck.response;
  const id = paramCheck.data;
  const risk = await getLiveRisk(id);
  return NextResponse.json(risk);
}
