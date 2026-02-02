import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { welcomebookId } = body;

    if (!welcomebookId) {
      return NextResponse.json({ error: "welcomebookId is required" }, { status: 400 });
    }

    const welcomebook = await prisma.welcomebook.findUnique({
      where: { id: welcomebookId },
    });

    if (!welcomebook) {
      return NextResponse.json({ error: "Welcomebook not found" }, { status: 404 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;
    const referer = request.headers.get("referer") || undefined;

    const visit = await prisma.visit.create({
      data: {
        welcomebookId,
        ipAddress,
        userAgent,
        referer,
      },
    });

    return NextResponse.json({ success: true, visitId: visit.id });
  } catch (error) {
    console.error("Error tracking visit:", error);
    return NextResponse.json({ error: "Failed to track visit" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const welcomebookId = searchParams.get("welcomebookId");

    if (!welcomebookId) {
      return NextResponse.json({ error: "welcomebookId is required" }, { status: 400 });
    }

    const visitCount = await prisma.visit.count({
      where: { welcomebookId },
    });

    return NextResponse.json({ count: visitCount });
  } catch (error) {
    console.error("Error getting visit count:", error);
    return NextResponse.json({ error: "Failed to get visit count" }, { status: 500 });
  }
}