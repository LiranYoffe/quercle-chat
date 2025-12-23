import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quercle Chat",
  description: "Model-agnostic AI chat with web capabilities. Use any OpenRouter model with web search and fetch tools.",
  keywords: ["Quercle", "AI chat", "OpenRouter", "model-agnostic", "web search", "web fetch", "chatbot", "client-side"],
  authors: [{ name: "Quercle" }],
  metadataBase: new URL("https://chat.quercle.dev"),
  openGraph: {
    title: "Quercle Chat",
    description: "Model-agnostic AI chat with web capabilities. Use any OpenRouter model with web search and fetch tools.",
    url: "https://chat.quercle.dev",
    siteName: "Quercle Chat",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quercle Chat",
    description: "Model-agnostic AI chat with web capabilities. Use any OpenRouter model with web search and fetch tools.",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
