import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

export const metadata: Metadata = {
  title: "KhropCut Production Board",
  description: "Studio production management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${pixelFont.variable} h-full`}>
      <body className={`${pixelFont.className} scanlines crt min-h-full`}>
        {children}
      </body>
    </html>
  );
}
