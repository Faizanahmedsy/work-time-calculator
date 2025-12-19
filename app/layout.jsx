import AntProvider from "@/components/AntProvider";
import Navbar from "@/components/Navbar";
import { Outfit } from "next/font/google";
import "./globals.css";

const inter = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "Work Watch",
  description: "Made by Faizanahmed",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntProvider>
          <main className="flex flex-col min-h-screen selection:bg-cyan-950 selection:text-white">
            <Navbar />
            {children}
          </main>
        </AntProvider>
      </body>
    </html>
  );
}
