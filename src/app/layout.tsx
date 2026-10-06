import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ShellLoader } from "@/components/ShellLoader";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Suggestions",
  description: "Internal suggestions forum for categories, threads, and replies.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable}`}>
        <ShellLoader>{children}</ShellLoader>
      </body>
    </html>
  );
}
