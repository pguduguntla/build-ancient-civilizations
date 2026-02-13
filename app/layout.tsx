import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ancient City Builder",
  description: "Shape an ancient civilization through your choices",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
