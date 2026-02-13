import { generateText } from "ai";
import { NextResponse } from "next/server";
import type { CivilizationId } from "@/app/lib/game-state";

export const maxDuration = 60;

const CIVILIZATION_IMAGE_STYLE: Record<CivilizationId, string> = {
  rome: "Architecture must look ANCIENT ROMAN: stone and marble, arches, columns, forums, Roman-style temples, aqueducts, villas with red tile roofs, amphitheaters, defensive walls and gates in Roman style. Mediterranean setting, warm stone tones.",
  india: "Architecture must look ANCIENT INDIAN: stone temples with carved pillars, stepwells, courtyards, stupa-style or temple spires, fortified towns, bazaars, royal and religious structures typical of ancient Indian dynasties. Subcontinental setting, rich earth and stone tones.",
  egypt: "Architecture must look ANCIENT EGYPTIAN: mud brick and stone, temples with pylons and columns, obelisks, flat roofs, Nile and canals, granaries, walled compounds. Desert and Nile setting, sand and stone tones, monumental feel.",
};

export async function POST(request: Request) {
  try {
    const { prompt, previousImage, previousImageMimeType, population, civilization } = (await request.json()) as {
      prompt: string;
      previousImage?: string;
      previousImageMimeType?: string;
      population?: number;
      civilization?: CivilizationId;
    };

    const civId = civilization === "rome" || civilization === "india" || civilization === "egypt" ? civilization : "rome";
    const civStyle = CIVILIZATION_IMAGE_STYLE[civId];

    const pop = population ?? 200;

    // Zoom tiers every 2000 from 2k up to 15k, then 15k+. Used for both "change from previous" and initial view.
    const zoomTiers = [
      { max: 500, change: "Keep a close aerial view. If the scene has new structures, adjust the composition to show them clearly.", initial: "Close aerial view showing individual huts and people. The settlement is small and intimate." },
      { max: 2000, change: "Zoom out more from the previous view to accommodate the growing town: new districts, surrounding farms, and expanding borders. If you need to reorganize the layout of the town or expand parts of it to show the growth, do so now. Keep the city centered.", initial: "Medium aerial view of a growing town with borders, farms, and districts." },
      { max: 4000, change: "Zoom out more from the previous view to accommodate the expanding city: more districts, fuller walls, and surrounding farmland. Reorganize or expand the layout as needed. Keep the city centered.", initial: "Aerial view of a town with clear districts, walls, and surrounding farmland. City centered." },
      { max: 6000, change: "Zoom out more from the previous view to accommodate the larger city: full city walls, multiple districts, and surrounding countryside. Reorganize or expand the layout as needed. Keep the city centered in the frame.", initial: "Wide aerial view showing full city walls, multiple districts, and surrounding countryside. City centered." },
      { max: 8000, change: "Zoom out more from the previous view to accommodate the growing metropolis: extended walls, outer neighborhoods, and more of the surrounding landscape. Reorganize and expand the layout. City centered.", initial: "Wide aerial view of a substantial city with extended walls, outer neighborhoods, and countryside. City centered." },
      { max: 10000, change: "Zoom out more from the previous view to accommodate the major city: full sprawl, outer settlements, and trade routes. Reorganize and expand the town layout to show the growth. City stays centered.", initial: "High aerial view of a major city with outer settlements and trade routes. City centered." },
      { max: 12000, change: "Zoom out further from the previous view to accommodate the sprawling city: satellite areas, roads, and surrounding landscape. Reorganize and expand the layout. City stays centered.", initial: "High aerial view of a sprawling city with satellite areas and surrounding landscape. City centered." },
      { max: 14000, change: "Zoom out further from the previous view to accommodate the large metropolis: outer settlements, trade routes, and vast surrounding territory. Reorganize and expand the layout. City stays centered.", initial: "High aerial view of a large metropolis with outer settlements and vast territory. City centered." },
      { max: 15000, change: "Zoom out further from the previous view to accommodate the grand city: full metropolis, satellite towns, and surrounding region. Reorganize and expand the layout. City stays centered.", initial: "Very high aerial view of a grand city with satellite towns and surrounding region. City centered." },
      { max: Infinity, change: "Zoom out significantly from the previous view to accommodate the grand civilization: massive city, satellite towns, harbors, roads, and vast territory. Expand and reorganize the layout as needed. City centered in frame.", initial: "Very high aerial view of a grand civilization: massive city, satellite towns, harbors, roads, vast territory. City centered." },
    ];
    const tier = zoomTiers.find((t) => pop < t.max) ?? zoomTiers[zoomTiers.length - 1];
    const viewChangeFromPrevious = tier.change;
    const initialView = tier.initial;

    const systemPrompt = `You are an artist generating images of an evolving ancient city/settlement.
Generate a bird's eye perspective illustration of the city.
${previousImage ? "When updating an existing city image, change the view and layout as instructed in the user message: zoom out if the city has grown, and reorganize or expand the town layout to accommodate new districts and buildings." : initialView}
${civStyle}
Style: Warm, painterly, ancient world aesthetic with rich earth tones. Keep the SAME civilization and architectural style in every image so the city feels consistent.
The image should clearly show buildings, walls, farmland, and other structures.
Make the city look like a living, breathing ancient world.

If the image would be very low resolution, generate a new image in the same style at adequate resolution instead.`;

    const messages: Array<{
      role: "user";
      content: Array<{ type: "text"; text: string } | { type: "image"; image: string; mimeType?: string }>;
    }> = [];

    if (previousImage) {
      messages.push({
        role: "user",
        content: [
          {
            type: "image",
            image: previousImage,
            mimeType: previousImageMimeType || "image/png",
          },
          {
            type: "text",
            text: `Here is the current state of the city (population about ${pop.toLocaleString()}).

VIEW AND LAYOUT: ${viewChangeFromPrevious}

Now generate an UPDATED version of this same city with the following changes: ${prompt}. Keep the same art style and civilization. Generate ONLY an image, no text.`,
          },
        ],
      });
    } else {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: `Generate an image of: ${prompt}. Generate ONLY an image, no text.`,
          },
        ],
      });
    }

    const { files } = await generateText({
      model: "google/gemini-3-pro-image",
      system: systemPrompt,
      messages,
    });

    const generatedImage = files?.[0] as unknown as { base64: string; mimeType?: string } | undefined;

    if (!generatedImage?.base64) {
      return NextResponse.json(
        { error: "No image was generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      image: generatedImage.base64,
      mimeType: generatedImage.mimeType ?? "image/png",
    });
  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
