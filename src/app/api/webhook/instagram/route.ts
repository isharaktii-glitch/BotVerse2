import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token) {
    const config = await prisma.botConfig.findFirst({
      where: { igAccountId: token },
    });
    if (config || token) {
      return new NextResponse(challenge, { status: 200 });
    }
  }
  return new NextResponse("Forbidden", { status: 403 });
}

async function getGeminiReply(userMessage: string, businessContext: string | null): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "Thanks for your message!";

  const systemPrompt = businessContext
    ? `You are a helpful customer service assistant for: ${businessContext}. Reply concisely (2-4 sentences).`
    : `You are a helpful customer service assistant. Reply concisely (2-4 sentences).`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nCustomer message: "${userMessage}"\n\nYour reply:` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
        }),
      }
    );
    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply ? reply.trim() : "Thanks for your message!";
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Thanks for your message!";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];

    const igAccountId = entry?.id;
    const senderId = messaging?.sender?.id;
    const messageText = messaging?.message?.text;

    if (!igAccountId || !senderId || !messageText) {
      return NextResponse.json({ success: true });
    }

    const botConfig = await prisma.botConfig.findFirst({
      where: { igAccountId },
      include: { user: true },
    });

    if (!botConfig || !botConfig.igActive || !botConfig.isActive || !botConfig.igAccessToken) {
      return NextResponse.json({ success: true });
    }
    if (!botConfig.user.isApproved) {
      return NextResponse.json({ success: true });
    }

    let replyText: string;
    if (botConfig.aiEnabled) {
      replyText = await getGeminiReply(messageText, botConfig.businessContext);
    } else {
      replyText = botConfig.welcomeMessage || "Hi! Thanks for messaging us.";
    }

    await fetch(`https://graph.facebook.com/v20.0/me/messages?access_token=${botConfig.igAccessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: replyText },
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Instagram webhook error:", err);
    return NextResponse.json({ success: true });
  }
}
