import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TTSProvider } from "./components/TTSprovider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SightSpeech",
  description: "ShellHacks 2025 Hackathon Project",
  icon: "/favicon.png",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true"/>
        <link href="https://fonts.googleapis.com/css2?family=Moirai+One&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet"/>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TTSProvider>
          {children}
        </TTSProvider>
      </body>
    </html>
  );
}
