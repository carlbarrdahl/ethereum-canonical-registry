import { Geist, Geist_Mono } from "next/font/google";

import "@workspace/ui/globals.css";
import { Providers } from "@/components/providers";
import { Metadata } from "next";
import { Header } from "@/components/header";
import { MintTokens } from "@/components/dev/mint-tokens";
import { ERC20Transfer } from "@/components/dev/erc20-transfer";
import { ErrorBoundary } from "@/components/error-boundary";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://curate.fund"),
  title: {
    default: "support.eth curator - Public Goods Funding Strategies",
    template: "%s | support.eth curator",
  },
  description:
    "Design, publish, and operate capital allocation strategies for the public goods ecosystem. Create transparent funding strategies and support impactful projects.",
  keywords: [
    "public goods",
    "funding",
    "capital allocation",
    "gitcoin",
    "grants",
    "crypto",
    "ethereum",
    "DeFi",
    "yield",
    "donations",
  ],
  authors: [{ name: "support.eth curator" }],
  creator: "support.eth curator",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://curate.fund",
    siteName: "support.eth curator",
    title: "support.eth curator - Public Goods Funding Strategies",
    description:
      "Design, publish, and operate capital allocation strategies for the public goods ecosystem.",
  },
  twitter: {
    card: "summary_large_image",
    title: "support.eth curator - Public Goods Funding Strategies",
    description:
      "Design, publish, and operate capital allocation strategies for the public goods ecosystem.",
    creator: "@curate_fund",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
      </head>
      <body
        className={` font-sans antialiased theme-warm ${fontSans.variable}`}
      >
        <Providers>
          <Header />
          <ErrorBoundary>
            <main className="max-w-screen-xl mx-auto min-h-svh pb-24">
              {children}

              <div className="mt-10 mx-6 py-6 px-6 rounded-lg border border-dashed border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                <p className="text-xs uppercase tracking-wider font-medium text-yellow-600 dark:text-yellow-400 mb-4">
                  Testnet Only
                </p>
                <div className="md:flex gap-2 space-y-2 md:space-y-0">
                  <MintTokens />
                  <ERC20Transfer />
                </div>
              </div>
            </main>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
