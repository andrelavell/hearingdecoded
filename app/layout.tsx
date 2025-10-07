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
  const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1099152278399519'
  return (
    <html lang="en">
      <body className={`${notoSerif.variable} antialiased bg-gray-50`}>
        <Script
          id="sharethis"
          src="https://platform-api.sharethis.com/js/sharethis.js#property=68e456bc9ac1bf93b5eb1f57&product=sop"
          strategy="beforeInteractive"
        />
        {/* Meta Pixel Base Code (init only; events fired per page) */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          `}
        </Script>
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
