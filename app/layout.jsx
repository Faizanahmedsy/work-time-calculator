import AntProvider from "@/components/AntProvider";
import { Inter, Nunito_Sans, Outfit, Work_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

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
          <main className="flex flex-col min-h-screen">
            <Navbar />
            {children}
          </main>
        </AntProvider>
      </body>
    </html>
  );
}
