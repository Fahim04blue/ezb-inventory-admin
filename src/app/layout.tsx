import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Essentials by Zatab Inventory Admin",
  description: "Private inventory admin panel for Essentials by Zatab.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
