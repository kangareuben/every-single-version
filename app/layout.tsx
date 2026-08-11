import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EverySingleVersion",
  description: "Find every version of a song on YouTube.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="border-t border-black/[.08] py-4 text-center text-xs text-zinc-500 dark:border-white/[.145] dark:text-zinc-500">
          Video search powered by{" "}
          <a
            href="https://www.youtube.com"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube
          </a>
        </footer>
      </body>
    </html>
  );
}
