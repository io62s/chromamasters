import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { CompareProvider } from "@/components/compare-provider";
import { CompareBar } from "@/components/compare-bar";
import { CompareView } from "@/components/compare-view";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChromaMasters - Extract & Explore Color Palettes",
  description:
    "Upload any image to extract its dominant color palette. Discover which master painters share your color world. Browse curated palettes from art history.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "ChromaMasters - Extract & Explore Color Palettes",
    description:
      "Upload any image to extract its dominant color palette. Discover which master painters share your color world.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(!t)t=window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark";if(t==="light")document.documentElement.classList.remove("dark");else document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} font-sans antialiased`}
      >
        <TooltipProvider>
          <CompareProvider>
            {children}
            <CompareBar />
            <CompareView />
          </CompareProvider>
        </TooltipProvider>
        <Toaster />
      </body>
    </html>
  );
}
