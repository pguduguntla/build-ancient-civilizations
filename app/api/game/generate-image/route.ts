import { generateText } from "ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { prompt, previousImage, previousImageMimeType, population } = (await request.json()) as {
      prompt: string;
      previousImage?: string;
      previousImageMimeType?: string;
      population?: number;
    };

    const pop = population ?? 200;
    let zoomLevel: string;
    if (pop < 500) {
      zoomLevel = "Close aerial view showing individual huts and people. The settlement is small and intimate.";
    } else if (pop < 2000) {
      zoomLevel = "Medium aerial view. The town is growing -- zoom out slightly to show the expanding borders, surrounding farms, and new districts.";
    } else if (pop < 5000) {
      zoomLevel = "Wide aerial view. The city is substantial -- zoom out to show the full city walls, multiple districts, and surrounding countryside. Keep the city centered.";
    } else if (pop < 15000) {
      zoomLevel = "High aerial view. This is a major city -- zoom out further to show the sprawling metropolis, outer settlements, trade routes, and surrounding landscape. City stays centered.";
    } else {
      zoomLevel = "Very high aerial/satellite view. This is a grand civilization -- zoom out significantly to show the massive city, satellite towns, harbors, roads, and vast territory. City centered in frame.";
    }

    const systemPrompt = `You are an artist generating images of an evolving ancient city/settlement.
Generate a bird's eye perspective illustration of the city.
${zoomLevel}
Style: Warm, painterly, ancient world aesthetic with rich earth tones.
The image should clearly show buildings, walls, farmland, and other structures.
Make the city look like a living, breathing ancient world.
IMPORTANT: As the city grows, zoom out to show its full extent while keeping it centered in the frame.`;

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
            text: `Here is the current state of the city. Now generate an UPDATED version of this same city with the following changes: ${prompt}. Keep the same art style, perspective, and general layout but show the evolution. Generate ONLY an image, no text.`,
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
