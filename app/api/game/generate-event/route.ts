import { generateText } from "ai";
import { NextResponse } from "next/server";
import type { Stats, HistoryEntry } from "@/app/lib/game-state";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const { turn, year, stats, history } = (await request.json()) as {
      turn: number;
      year: number;
      stats: Stats;
      history: HistoryEntry[];
    };

    const recentHistory = history.slice(-5);
    const historyContext =
      recentHistory.length > 0
        ? recentHistory
            .map((h) => `Turn ${h.turn} (${h.year < 0 ? Math.abs(h.year) + " BCE" : h.year + " CE"}): ${h.eventTitle} -> Player chose: ${h.choiceLabel}`)
            .join("\n")
        : "No history yet - this is the founding of the settlement.";

    const systemPrompt = `You are the game master for an ancient city builder game. You generate dramatic, visually impactful events.

Current game state:
- Turn: ${turn}
- Year: ${year < 0 ? Math.abs(year) + " BCE" : year + " CE"}
- Population: ${stats.population}
- Gold: ${stats.gold}/5
- Food: ${stats.food}/5
- Defense: ${stats.defense}/5
- Culture: ${stats.culture}/5

Recent history:
${historyContext}

CRITICAL RULES FOR EVENT DESIGN:

1. EVENTS MUST BE VISUALLY DRAMATIC. Every event should physically change what the city looks like from above. Think:
   - Natural disasters: floods, earthquakes, volcanic eruptions, droughts (dried rivers, cracked earth)
   - Resource discoveries: gold veins in nearby hills, fertile valley found, stone quarry discovered
   - Invasions: armies approaching, siege camps outside walls, buildings on fire
   - Growth milestones: population boom requiring expansion, trade caravans arriving with exotic goods
   - Construction opportunities: enough resources to build monuments, walls, aqueducts, harbors
   
   DO NOT generate abstract political/diplomatic events that wouldn't show up visually (e.g. "an advisor disagrees", "a treaty is proposed", "taxes are debated").

2. CHOICES MUST RESULT IN VISIBLE CITY CHANGES. Each choice should describe a concrete physical transformation:
   - "Build stone walls around the city" NOT "Increase defense"
   - "Construct irrigation canals to the eastern farms" NOT "Improve food supply"  
   - "Erect a grand temple in the city center" NOT "Invest in culture"
   - "Expand the marketplace with merchant stalls" NOT "Focus on trade"

3. Each event has a "visualChange" field describing what the event itself does to the city visually BEFORE the player chooses. This is what the city should look like when the event strikes. Each choice also has a "visualChange" describing the physical result.

4. Each choice has an "outcome" field -- a dramatic 1-2 sentence narrative describing what happened AFTER the player made this choice. Write it like a story: "Your warriors rallied at the gates and repelled the invaders! The spoils of war filled your treasury." Make outcomes feel consequential and satisfying.

5. Stat effects: integers between -2 and +2 for resources (gold/food/defense/culture), between -500 and +500 for population.
6. yearAdvance: between 3 and 15 years.
${turn === 0 ? '6. This is the FIRST turn. The settlement is a tiny cluster of mud huts. Generate an event about choosing what to build first -- farms, walls, or a shrine.' : ''}
${stats.food <= 1 ? '6. Food is critically low! Generate a famine/drought crisis that visually shows barren fields and starving conditions.' : ''}
${stats.defense <= 1 ? '6. Defense is very weak! Generate an invasion or raid that visually shows enemy forces and destruction.' : ''}

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "title": "SHORT EVENT TITLE",
  "description": "2-3 sentences describing what is happening. Make it dramatic and visual.",
  "visualChange": "Describe exactly what the city looks like NOW due to this event. E.g. 'The river has burst its banks, flooding the eastern quarter. Muddy water surrounds half the buildings. People are on rooftops.'",
  "choices": [
    { "id": "choice1", "label": "Short action (e.g. Build stone levees)", "effects": { "population": 0, "gold": 0, "food": 0, "defense": 0, "culture": 0 }, "visualChange": "Describe what the city looks like AFTER this choice. E.g. 'Stone levees now line the riverbank. The flooded area has been drained and rebuilt with stronger foundations.'", "outcome": "1-2 sentence narrative of what happened. E.g. 'Your engineers worked tirelessly to build stone levees. The flood waters receded, and the rebuilt eastern quarter is now stronger than ever.'" },
    { "id": "choice2", "label": "Short action", "effects": { "population": 0, "gold": 0, "food": 0, "defense": 0, "culture": 0 }, "visualChange": "Physical result description", "outcome": "Narrative of what happened as a result" },
    { "id": "choice3", "label": "Short action", "effects": { "population": 0, "gold": 0, "food": 0, "defense": 0, "culture": 0 }, "visualChange": "Physical result description", "outcome": "Narrative of what happened as a result" }
  ],
  "yearAdvance": 5
}`;

    const { text } = await generateText({
      model: "google/gemini-3-pro-image",
      system: systemPrompt,
      prompt: "Generate the next event for the player's civilization. Respond with ONLY valid JSON.",
    });

    const cleanedText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const event = JSON.parse(cleanedText);

    if (!event.title || !event.description || !Array.isArray(event.choices) || event.choices.length < 2) {
      throw new Error("Invalid event structure");
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error generating event:", error);
    return NextResponse.json(
      { error: "Failed to generate event" },
      { status: 500 }
    );
  }
}
