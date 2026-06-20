import "./styles.css";

export const metadata = {
  title: "AegisLua | Lua Script Licensing",
  description: "Script licensing, monetized claim links, device binding, and Lua authentication infrastructure",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
