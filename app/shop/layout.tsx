import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Discover our full collection of luxury fragrances and coffret gift-box packaging.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
