import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Parkinsans } from "next/font/google";
import { Suspense } from "react";
import { BottomNav } from "@/components/ui";
import { TEXT_SIZE_COOKIE, THEME_COOKIE } from "@/features/settings/validation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Titles only (h1-h3, font-display). Body text stays in Geist for readability at small sizes.
const parkinsans = Parkinsans({
  variable: "--font-parkinsans",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "App Pessoal",
  description: "Meu app pessoal para facilitar o dia a dia",
};

// Browser bar color on phones; matches --background in globals.css.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d7d9ce" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1c1e" },
  ],
};

// Applies the saved theme and text size before first paint. Reading the cookies on the server would make the
// root layout block every route under cacheComponents (next docs: preventing-flash-before-hydration).
const applyPrefs = `(function(){try{var d=document.documentElement,c=document.cookie;var t=c.match(/(?:^|; )${THEME_COOKIE}=(light|dark)/);if(t)d.setAttribute("data-theme",t[1]);var s=c.match(/(?:^|; )${TEXT_SIZE_COOKIE}=(sm|lg)/);if(s)d.setAttribute("data-text-size",s[1])}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${parkinsans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: applyPrefs }} />
      </head>
      <body className="flex min-h-full flex-col">
        {children}
        <Suspense>
          <BottomNav />
        </Suspense>
      </body>
    </html>
  );
}
