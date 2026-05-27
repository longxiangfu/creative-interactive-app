import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "创意交互",
  description: "与创意角色进行互动 - 鼠标交互与语义动作联动",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
