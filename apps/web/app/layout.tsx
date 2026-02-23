import { Geist, Geist_Mono } from "next/font/google";

import "@ethereum-canonical-registry/ui/globals.css";
import { Providers } from "@/components/providers";
import { Metadata } from "next";
import { Header } from "@/components/header";
import { MintTokens } from "@/components/dev/mint-tokens";
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
  metadataBase: new URL("https://canonical.registry"),
  title: {
    default: "Canonical Registry — Off-chain entity registry",
    template: "%s | Canonical Registry",
  },
  description:
    "Send ERC-20 tokens to any GitHub repository or DNS domain. Funds accumulate at a deterministic deposit address until the owner claims them.",
  keywords: [
    "public goods",
    "open source",
    "funding",
    "ethereum",
    "github",
    "canonical registry",
    "escrow",
  ],
  authors: [{ name: "Canonical Registry" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Canonical Registry",
    title: "Canonical Registry — Fund any GitHub repo or domain",
    description:
      "Send ERC-20 tokens to any GitHub repository or DNS domain. Funds accumulate at a deterministic deposit address until the owner claims them.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      
      <body className={`font-sans antialiased theme-warm ${fontSans.variable} ${fontMono.variable}`}>
        <Providers>
          <Header />
          <ErrorBoundary>
            <main className="max-w-screen-xl mx-auto min-h-svh pb-24">
              {children}

              <div className="mt-10 mx-6 py-6 px-6 rounded-lg border border-dashed border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
                <p className="text-xs uppercase tracking-wider font-medium text-yellow-600 dark:text-yellow-400 mb-4">
                  Testnet Only
                </p>
                <MintTokens />
              </div>
            </main>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
