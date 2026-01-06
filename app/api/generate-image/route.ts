import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // Nano Banana Pro (google/gemini-3-pro-image) is a multimodal LLM
    // that returns images as content parts in the response
    const { files } = await generateText({
      model: "google/gemini-3-pro-image",
      prompt: prompt || "Generate a beautiful modern home with large windows and a garden",
    });

    // Get the first generated file (image)
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

