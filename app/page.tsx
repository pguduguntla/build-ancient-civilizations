"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useState, useEffect } from "react";

// Type for file with preview URL
type FileWithPreview = {
  file: File;
  previewUrl: string;
};

// Convert uploaded files to data URLs for sending with messages
async function convertFilesToDataURLs(
  files: FileWithPreview[]
): Promise<{ type: "file"; filename: string; mediaType: string; url: string }[]> {
  return Promise.all(
    files.map(
      ({ file }) =>
        new Promise<{
          type: "file";
          filename: string;
          mediaType: string;
          url: string;
        }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              type: "file",
              filename: file.name,
              mediaType: file.type,
              url: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [filesWithPreview, setFilesWithPreview] = useState<FileWithPreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, status } = useChat();

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      filesWithPreview.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Need either text or files to send
    const hasText = input.trim().length > 0;
    const hasFiles = filesWithPreview.length > 0;
    if (!hasText && !hasFiles) return;

    // Convert files to data URLs
    const fileParts = hasFiles ? await convertFilesToDataURLs(filesWithPreview) : [];

    // Build message parts
    const parts: ({ type: "text"; text: string } | { type: "file"; filename: string; mediaType: string; url: string })[] = [];
    
    if (hasText) {
      parts.push({ type: "text", text: input });
    }
    parts.push(...fileParts);

    sendMessage({ role: "user", parts });

    // Cleanup preview URLs and reset form
    filesWithPreview.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    setInput("");
    setFilesWithPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFilesWithPreview = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setFilesWithPreview(newFilesWithPreview);
  };
  
  // Check if file type is browser-displayable
  const isDisplayableImage = (mimeType: string) => {
    const supported = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];
    return supported.includes(mimeType.toLowerCase());
  };

  const handleRemoveFile = (index: number) => {
    // Revoke the URL being removed
    URL.revokeObjectURL(filesWithPreview[index].previewUrl);
    
    setFilesWithPreview((prev) => prev.filter((_, i) => i !== index));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            <p className="text-sm mt-1">Or upload an image and ask questions about it!</p>
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
                
                // Handle file parts (images)
                if (part.type === "file") {
                  const mediaType = part.mediaType || (part as Record<string, unknown>).mimeType as string;
                  const url = part.url || (part as Record<string, unknown>).data as string;
                  const filename = (part as Record<string, unknown>).filename as string | undefined;
                  
                  if (mediaType?.startsWith("image/") && url) {
                    // Check if it's a browser-supported image format
                    const supportedFormats = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];
                    const isSupported = supportedFormats.some(f => mediaType.toLowerCase().startsWith(f.split("/")[1]) || mediaType.toLowerCase() === f);
                    
                    if (!isSupported) {
                      // Show placeholder for unsupported formats like HEIC
                      return (
                        <div key={i} className="flex items-center gap-2 mt-2 p-3 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                            <circle cx="9" cy="9" r="2"/>
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                          </svg>
                          <span className="text-sm text-zinc-600 dark:text-zinc-300">
                            {filename || "Image"} ({mediaType.split("/")[1].toUpperCase()})
                          </span>
                        </div>
                      );
                    }
                    
                    // If url is base64 without data prefix, add it
                    const imgSrc = url.startsWith("data:") ? url : `data:${mediaType};base64,${url}`;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={imgSrc}
                        alt={filename || "Image"}
                        className="rounded-lg max-w-full mt-2 h-auto max-h-96"
                      />
                    );
                  }
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

      {/* Image Preview */}
      {filesWithPreview.length > 0 && (
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-900">
          <div className="flex gap-2 overflow-x-auto">
            {filesWithPreview.map(({ file, previewUrl }, index) => (
              <div key={index} className="relative shrink-0">
                {isDisplayableImage(file.type) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  // Fallback for HEIC and other unsupported formats
                  <div className="w-20 h-20 bg-zinc-700 rounded-lg flex flex-col items-center justify-center text-zinc-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="9" cy="9" r="2"/>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                    <span className="text-[10px] mt-1">{file.type.split("/")[1].toUpperCase()}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-800">
        <div className="flex gap-3 items-center">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            className="hidden"
          />
          
          {/* Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 rounded-xl bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Upload images"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <circle cx="9" cy="9" r="2"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
            </svg>
          </button>

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
            disabled={isLoading || (!input.trim() && filesWithPreview.length === 0)}
            className="px-6 py-3 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
