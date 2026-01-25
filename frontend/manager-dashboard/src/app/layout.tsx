import type { Metadata } from "next";
import "./globals.css";
import DashboardLayout from "@/components/dashboard-layout";

export const metadata: Metadata = {
  title: "CrewSync - Manager Dashboard",
  description: "AI-powered crew coordination for American Airlines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700,900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-satoshi antialiased">
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
