import { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { ArrowLeft } from "lucide-react";

const ibm_plex_sans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you were looking for no longer exists.',
}

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${ibm_plex_sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="text-center flex flex-col h-dvh justify-center">
          <div className="flex flex-col gap-3">
            <h1 className="text-9xl font-black">404</h1>
            <p>The page you were looking for no longer exists.</p>
          </div>
          {/* eslint-disable-next-line */}
          <a href="/dashboard"><button className="main-button flex flex-row gap-1 mx-auto mt-8 font-bold items-center justify-center w-fit"><ArrowLeft/> Dashboard</button></a>
        </div>
      </body>
    </html>
  )
}
