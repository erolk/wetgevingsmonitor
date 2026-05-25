import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beheer — Wetgevingsmonitor",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-[60vh]">{children}</div>;
}
