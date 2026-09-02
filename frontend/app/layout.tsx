import type { Metadata } from "next";
import { Special_Elite, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const specialElite = Special_Elite({
  variable: "--font-special-elite",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devil's Advocate",
  description: "Attack your own strategy before someone else does.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${specialElite.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
