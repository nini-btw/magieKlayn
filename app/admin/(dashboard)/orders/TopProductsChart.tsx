"use client";

import { PackageIcon } from "lucide-react";
import type { ProductSalesStat } from "@/domain/entities/order";

// Per-fragrance units-sold breakdown — same homemade bar-list style as
// TopWilayasChart/StatusChart (this codebase has no charting library
// installed), shared between the orders page and the dashboard overview so
// the markup isn't duplicated.
export function TopProductsChart({
  stats,
  t,
}: {
  stats: ProductSalesStat[];
  t: (key: string) => string;
}) {
  const maxSold = Math.max(...stats.map((s) => s.quantitySold), 1);

  return (
    <div className="admin-chart-panel">
      <h3 className="admin-chart-title">
        <PackageIcon className="w-4 h-4" />
        {t("admin.orders.topProducts")}
      </h3>
      {stats.length === 0 ? (
        <p className="admin-empty">{t("admin.orders.noData")}</p>
      ) : (
        <div className="admin-bar-list">
          {stats.map((stat, index) => {
            const barWidth = (stat.quantitySold / maxSold) * 100;
            return (
              <div className="admin-bar-row" key={stat.productId}>
                <div className="admin-bar-label">
                  <span className="admin-bar-rank">{index + 1}</span>
                  <span
                    style={
                      stat.productColorHex
                        ? {
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            backgroundColor: stat.productColorHex,
                            marginInlineEnd: 2,
                          }
                        : undefined
                    }
                  />
                  <span>{stat.productName}</span>
                </div>
                <div className="admin-bar-track">
                  <div
                    className="admin-bar-fill"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="admin-bar-meta">
                  <span>
                    {stat.quantitySold} {t("admin.products.form.sold")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
