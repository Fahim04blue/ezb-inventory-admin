import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Essentials by Zatab Inventory Admin",
  description: "Private inventory admin panel for Essentials by Zatab.",
  icons: {
    icon: [
      {
        url: "/brand-logos/essentials_logo.jpg",
        type: "image/jpeg",
      },
    ],
    shortcut: "/brand-logos/essentials_logo.jpg",
    apple: "/brand-logos/essentials_logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased" suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
