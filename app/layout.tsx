import type { Metadata } from "next";
import "./globals.css";
import Footer from '@/components/layout/Footer'; // Import your Footer

export const metadata: Metadata = {
  title: "LearnHub | Master Skills with Expert-Led Courses",
  description: "Join thousands of learners mastering new skills with our comprehensive video courses. Start your learning journey today.",
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
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <div className="min-h-screen flex flex-col">
          {/* Main content area - grows to fill space */}
          <div className="flex-1 w-full overflow-x-hidden">
            {children}
          </div>
          
          {/* Footer - always at bottom */}
          <Footer />
        </div>
      </body>
    </html>
  );
}
