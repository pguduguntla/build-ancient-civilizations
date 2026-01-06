"use client";

import { useChat } from "@ai-sdk/react";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header */}
      <header className="p-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold text-white">Dream Home Designer</h1>
        <p className="text-sm text-zinc-500">Chat with AI to design your dream home</p>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-20">
            <p>Start a conversation!</p>
            <p className="text-sm mt-2">Try: &quot;Generate an image of a modern minimalist house&quot;</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === "user"
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-white"
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === "text" && part.text) {
                  return (
                    <p key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  );
                }
                if (part.type === "file" && part.mediaType?.startsWith("image/")) {
                  return (
                    <Image
                      key={i}
                      src={part.url}
                      alt="Generated"
                      width={512}
                      height={512}
                      className="rounded-lg max-w-full mt-2 h-auto"
                      unoptimized
                    />
                  );
                }
                // Handle reasoning parts (thinking/reasoning from the model)
                if (part.type === "reasoning" && "text" in part && part.text) {
                  return (
                    <p key={i} className="whitespace-pre-wrap text-zinc-400 italic text-sm">
                      {part.text}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 text-zinc-400 rounded-2xl px-4 py-3">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything or describe a home to generate..."
            className="flex-1 p-3 rounded-xl bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:border-zinc-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
