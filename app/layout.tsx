import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Billing Control Room",
  description: "Modern invoice generator and manager"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
