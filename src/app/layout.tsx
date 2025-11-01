import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shimcaht Zion - Support System",
  description: "Family support management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
