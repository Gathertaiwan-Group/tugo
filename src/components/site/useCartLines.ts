"use client";
import { useMemo } from "react";
import { useSite } from "./SiteProvider";
import { FREE_SHIP_THRESHOLD, money, shippingFee, type ShipMethod } from "@/lib/site/format";
import type { CartLine, LiteProduct } from "@/lib/site/types";

export type CartView = CartLine & {
  product: LiteProduct;
  artistName: string;
  variant: string;
  shipText: string;
  lineTotal: number;
};

/** 購物車明細：價格一律取自 DB 目錄（catalog），不信任 localStorage。 */
export function useCartLines(ship: ShipMethod = "home") {
  const { cart, productById, catalog } = useSite();
  return useMemo(() => {
    const lines: CartView[] = [];
    for (const c of cart) {
      const p = productById.get(c.id);
      if (!p) continue;
      lines.push({
        ...c,
        product: p,
        artistName: catalog.artists.find((a) => a.id === p.artist_id)?.name ?? "",
        variant: [c.color, c.size].filter(Boolean).join("／") || "單一規格",
        shipText: p.status === "preorder" ? `預購・預計 ${p.ship_date} 出貨` : "現貨",
        lineTotal: p.price * c.qty,
      });
    }
    const sub = lines.reduce((t, l) => t + l.lineTotal, 0);
    const fee = shippingFee(sub, ship);
    return {
      lines,
      sub,
      fee,
      total: sub + fee,
      subText: money(sub),
      shipText: fee === 0 ? (sub ? "免運" : "—") : money(fee),
      totalText: money(sub + fee),
      freeHint:
        sub > 0 && sub < FREE_SHIP_THRESHOLD ? `再買 ${money(FREE_SHIP_THRESHOLD - sub)} 即可免運` : sub >= FREE_SHIP_THRESHOLD ? "已達免運門檻" : "",
    };
  }, [cart, productById, catalog.artists, ship]);
}
