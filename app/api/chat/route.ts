import { convertToModelMessages, streamText, UIMessage } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages }: { messages: UIMessage[] } = await request.json();

  // Use Nano Banana Pro (google/gemini-3-pro-image) which can both
  // chat AND generate images as a multimodal LLM
  const result = streamText({
    model: "google/gemini-3-pro-image",
    system: `You are a helpful assistant that can chat and generate images. 
When the user asks you to create, draw, or generate an image, do so directly.
Be conversational and helpful.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

