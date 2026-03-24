import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agora",
  description: "Europe's video meeting platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
