import type { Metadata, Viewport } from "next";
import { Unbounded, Manrope } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700", "900"],
});

const manrope = Manrope({
  variable: "--font-text",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "NADIR — часы, рождённые давлением",
  description:
    "Погружение на 7 500 метров. Иммерсивная презентация абиссальной серии NADIR: одна непрерывная сцена от поверхности до дна.",
};

export const viewport: Viewport = {
  themeColor: "#020b12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${manrope.variable}`}>
      <body>{children}</body>
    </html>
  );
}
