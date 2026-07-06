import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthGuard } from "@/components/AuthGuard";
import { AuthProvider } from "@/features/auth/auth_context";
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
  title: "共有家計簿",
  description: "2人で支出を共有し、毎月の精算を自動計算する家計簿アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "共有家計簿",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-svh flex-col bg-background text-foreground">
        <AuthProvider>
          <AuthGuard>
            <div className="flex min-h-svh flex-1 flex-col">{children}</div>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
