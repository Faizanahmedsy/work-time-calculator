import { Inter } from "next/font/google";
import "./globals.css";
import { ConfigProvider, theme } from "antd";
import AntProvider from "@/components/AntProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Work Time Tracker",
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
