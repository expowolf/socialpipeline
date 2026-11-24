import { NextResponse } from "next/server";
import { readHistory } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await readHistory());
}
