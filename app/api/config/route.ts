import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    appName: process.env.APP_NAME || "Pousada Sancho",
    appUrl: process.env.APP_URL || "http://localhost:3002",
  });
}
