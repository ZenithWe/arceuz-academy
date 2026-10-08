import type { Metadata } from "next";
import "./globals.css";
import "./storefront.css";

export const metadata: Metadata = {
  title: "Arceuz Academy — Seu próximo nível começa com conhecimento",
  description: "Conheça a Arceuz Academy. Explore cursos de marketing, inteligência artificial e design, consulte os programas e aprenda no seu ritmo.",
  icons: {
    icon: "/arceuz-logo.png",
    shortcut: "/arceuz-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
