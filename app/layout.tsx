// app/layout.tsx 
import type { Metadata } from "next";
import "./globals.css";
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: "Master Arabic | Learn Arabic Online with Expert Tutors",
  description: "Start your journey to fluency with our immersive video courses. Learn Modern Standard Arabic and dialects with interactive lessons, expert instructors, and a supportive community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <div className="min-h-screen flex flex-col">
          {/* Main content area */}
          <div className="flex-1 w-full overflow-x-hidden">
            {children}
          </div>
          
          
          <Footer />
        </div>
      </body>
    </html>
  );
}
