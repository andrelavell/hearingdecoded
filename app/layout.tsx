import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Script from "next/script";

const notoSerif = Noto_Serif({ 
  subsets: ["latin"],
  variable: "--font-noto-serif",
});

export const metadata: Metadata = {
  title: "Hearing Decoded",
  description: "Listen to our audiobooks and podcasts",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSerif.variable} antialiased bg-gray-50`}>
        <Script
          id="sharethis"
          src="https://platform-api.sharethis.com/js/sharethis.js#property=68e456bc9ac1bf93b5eb1f57&product=sop"
          strategy="beforeInteractive"
        />
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
