import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse our selection of freshly baked American-style cookies and custom boxes.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
