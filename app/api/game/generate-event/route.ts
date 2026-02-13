import { generateText } from "ai";
import { NextResponse } from "next/server";
import type { Stats, HistoryEntry, CivilizationId } from "@/app/lib/game-state";

export const maxDuration = 30;

const CIVILIZATION_GUIDANCE: Record<CivilizationId, string> = {
  rome: `This civilization is ANCIENT ROME. Events, choices, and outcomes must feel Roman:
- Setting: Italy/Mediterranean. Think forums, legions, senators, aqueducts, villas, Roman roads, Latin names for places/people where it fits.
- Building style: stone and marble, arches, columns, amphitheaters, temples to Roman gods, baths, defensive walls in Roman style.
- Events: barbarian incursions, grain supply from Egypt, civil strife, military campaigns, gladiator games, census, road building, colonial expansion.
- Choices should reference Roman institutions (Senate, legions, tribunes) and Roman architecture (forum, basilica, circus).`,

  india: `This civilization is ANCIENT INDIA. Events, choices, and outcomes must feel Indian:
- Setting: Indian subcontinent. Think dynasties, trade routes, temples, stepwells, stupas, Sanskrit influence, diverse regions.
- Building style: stone temples, carved pillars, courtyards, ghats, fortified towns, market bazaars, ashrams, royal palaces with Indian architectural elements.
- Events: monsoon and harvest, trade with distant lands, dynastic succession, religious patronage, invasions from the northwest, river changes, pilgrimage, spice routes.
- Choices should reference Indian context (dharma, kingdoms, guilds, temples, rivers) and Indian architecture and society.`,

  egypt: `This civilization is ANCIENT EGYPT. Events, choices, and outcomes must feel Egyptian:
- Setting: Nile valley and delta. Think pharaohs, priests, Nile floods, desert, monuments, papyrus, hieroglyphs.
- Building style: mud brick and stone, temples with pylons and columns, obelisks, pyramids in the distance, granaries, harbors on the Nile, walled compounds.
- Events: Nile flood or drought, pharaonic decrees, tomb building, trade with Punt or Levant, invasion from the sea or desert, religious festivals, grain storage.
- Choices should reference Egyptian context (pharaoh, temples, Nile, afterlife, priests) and Egyptian architecture and culture.`,
};

export async function POST(request: Request) {
  try {
    const { turn, year, stats, history, civilization } = (await request.json()) as {
      turn: number;
      year: number;
      stats: Stats;
      history: HistoryEntry[];
      civilization?: CivilizationId;
    };

    const civId = civilization === "rome" || civilization === "india" || civilization === "egypt" ? civilization : "rome";
    const civGuidance = CIVILIZATION_GUIDANCE[civId];

    const recentHistory = history.slice(-5);
    const historyContext =
      recentHistory.length > 0
        ? recentHistory
            .map((h) => `Turn ${h.turn} (${h.year < 0 ? Math.abs(h.year) + " BCE" : h.year + " CE"}): ${h.eventTitle} -> Player chose: ${h.choiceLabel}`)
            .join("\n")
        : "No history yet - this is the founding of the settlement.";

    const systemPrompt = `You are the game master for an ancient city builder game. You generate dramatic, visually impactful events.

${civGuidance}

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

5. Stat effects (REQUIRED — every choice must change the game state):
   - Resources (gold, food, defense, culture): integers from -2 to +2. Give at least one resource a non-zero value per choice.
   - Population (growth should feel EXPONENTIAL — smaller gains when small, larger gains when big):
     • GROWTH (positive): scale gains with current population. Current population is ${stats.population}. When the city is smaller (e.g. under 3000), add modest amounts per good choice (e.g. +200 to +600). When medium (3000–7000), add more (e.g. +500 to +1500). When large (7000+), add even more so growth accelerates (e.g. +1000 to +3000 or more). Bigger cities should gain more people per successful choice than smaller ones.
     • LOSSES (negative): for normal setbacks (raids, famine, plague, flood, siege damage) do NOT exceed 10-15% of current population. Current population is ${stats.population}, so max normal loss is about ${Math.max(50, Math.ceil(stats.population * 0.15))} (15% of current). Only for truly catastrophic events may loss exceed that. For a raid or bad harvest, use a loss in the 10-15% range.
   - Each choice's "effects" must match the action: e.g. "Expand the settlement" → population gain in the range above; "Raid repelled with casualties" → population -${Math.max(50, Math.ceil(stats.population * 0.12))} (about 12%).
6. yearAdvance: between 3 and 15 years.
${turn <= 1 ? `7. EARLY GAME — this is one of the first two events (turn ${turn}). Favor good news: opportunities, growth, discoveries, construction, trade, a bountiful harvest, or a blessing. Avoid disasters (floods, famine, invasion, plague) in these opening events so the player gets a hopeful start. At least 2 of the 3 choices should have net positive population and/or resource effects. The event can still present a meaningful choice (e.g. "Which blessing to pursue?" or "Where to expand first?") without being a crisis.` : ''}
${turn === 0 ? `8. This is the FIRST turn. The settlement is an early ${civId === "rome" ? "Roman" : civId === "india" ? "Indian" : "Egyptian"} village. Generate an event about choosing what to build or prioritize first, using culturally appropriate buildings and terms.` : ''}
${stats.food <= 1 && turn > 1 ? '8. Food is critically low! Generate a famine/drought crisis that visually shows barren fields and starving conditions.' : ''}
${stats.defense <= 1 && turn > 1 ? '8. Defense is very weak! Generate an invasion or raid that visually shows enemy forces and destruction.' : ''}

You MUST respond with ONLY valid JSON in this exact format, no other text:
{
  "title": "SHORT EVENT TITLE",
  "description": "2-3 sentences describing what is happening. Make it dramatic and visual.",
  "visualChange": "Describe exactly what the city looks like NOW due to this event. E.g. 'The river has burst its banks, flooding the eastern quarter. Muddy water surrounds half the buildings. People are on rooftops.'",
  "choices": [
    { "id": "choice1", "label": "Short action (e.g. Build stone levees)", "effects": { "population": 1200, "gold": 0, "food": 1, "defense": 1, "culture": 0 }, "visualChange": "Describe what the city looks like AFTER this choice.", "outcome": "1-2 sentence narrative of what happened." },
    { "id": "choice2", "label": "Short action (loss option)", "effects": { "population": -75, "gold": 1, "food": 0, "defense": 0, "culture": 1 }, "visualChange": "Physical result description", "outcome": "Narrative (loss should be ~10-15% of current pop)" },
    { "id": "choice3", "label": "Short action", "effects": { "population": 800, "gold": -1, "food": 2, "defense": 0, "culture": 0 }, "visualChange": "Physical result description", "outcome": "Narrative of what happened as a result" }
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
