import { NextResponse } from "next/server";
import { getLiveRisk } from "@/lib/risk-engine";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const risk = await getLiveRisk(id);
  return NextResponse.json(risk);
}
