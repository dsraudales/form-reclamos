import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CREE - Sistema de Reclamos",
  description: "Formulario institucional para recepción de reclamos."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background antialiased">{children}</body>
    </html>
  );
}
