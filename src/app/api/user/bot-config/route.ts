import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isApproved) {
      return NextResponse.json(
        { error: "Your account is not approved yet. Please complete payment." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      waPhoneNumberId,
      waAccessToken,
      waVerifyToken,
      waNumber,
      waActive,
      fbPageId,
      fbAccessToken,
      fbVerifyToken,
      fbActive,
      igAccountId,
      igAccessToken,
      igActive,
      welcomeMessage,
      isActive,
      aiEnabled,
      businessContext,
    } = body;

    const updated = await prisma.botConfig.update({
      where: { userId: payload.id },
      data: {
        ...(waPhoneNumberId !== undefined && { waPhoneNumberId }),
        ...(waAccessToken !== undefined && { waAccessToken }),
        ...(waVerifyToken !== undefined && { waVerifyToken }),
        ...(waNumber !== undefined && { waNumber }),
        ...(waActive !== undefined && { waActive }),
        ...(fbPageId !== undefined && { fbPageId }),
        ...(fbAccessToken !== undefined && { fbAccessToken }),
        ...(fbVerifyToken !== undefined && { fbVerifyToken }),
        ...(fbActive !== undefined && { fbActive }),
        ...(igAccountId !== undefined && { igAccountId }),
        ...(igAccessToken !== undefined && { igAccessToken }),
        ...(igActive !== undefined && { igActive }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(isActive !== undefined && { isActive }),
        ...(aiEnabled !== undefined && { aiEnabled }),
        ...(businessContext !== undefined && { businessContext }),
      },
    });

    return NextResponse.json({ success: true, botConfig: updated });
  } catch (err) {
    console.error("Error in /api/user/bot-config:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
