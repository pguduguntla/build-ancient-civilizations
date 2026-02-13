import { generateText } from "ai";
import { NextResponse } from "next/server";

export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    const { phase, eventTitle, choiceLabel, year } = (await request.json()) as {
      phase: "processing" | "loading";
      eventTitle?: string;
      choiceLabel?: string;
      year?: number;
    };

    const yearStr = year ? (year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`) : "";

    let prompt: string;
    if (phase === "processing" && eventTitle && choiceLabel) {
      prompt = `You are narrating an ancient city builder game. The player just faced "${eventTitle}" and chose "${choiceLabel}" (around ${yearStr}).

Generate exactly 5 short atmospheric loading messages (max 8 words each) that reflect the consequences of this specific decision unfolding. They should feel like brief glimpses of what's happening in the city right now as a result.

Examples of the style (but make them specific to this event/choice):
- "Soldiers march to the eastern wall"
- "Smoke rises from the new forges"
- "Traders count the remaining grain"`;
    } else {
      prompt = `You are narrating an ancient city builder game set around ${yearStr}.

Generate exactly 5 short atmospheric loading messages (max 8 words each) about daily life continuing in an ancient city. They should feel peaceful and mundane — life going on between major events.

Examples of the style:
- "Children play near the river"
- "Merchants open their stalls at dawn"
- "Elders gather beneath the old oak"`;
    }

    const { text } = await generateText({
      model: "google/gemini-2.0-flash",
      prompt,
      temperature: 0.9,
    });

    const messages = text
      .split("\n")
      .map((line) => line.replace(/^[\d\-.*•]+\s*/, "").replace(/^[""]|[""]$/g, "").trim())
      .filter((line) => line.length > 0 && line.length < 60)
      .slice(0, 5);

    return NextResponse.json({ messages: messages.length > 0 ? messages : null });
  } catch {
    return NextResponse.json({ messages: null });
  }
}
