import AntProvider from "@/components/AntProvider";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Work Watch",
  description: "Made by Faizanahmed",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AntProvider>{children}</AntProvider>
      </body>
    </html>
  );
}
