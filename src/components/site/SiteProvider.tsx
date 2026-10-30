"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ADD_TO_CART } from "@/lib/env";
import { cartKey } from "@/lib/site/format";
import type { CartLine, LiteCatalog, LiteProduct } from "@/lib/site/types";

const CART_KEY = "tugo-demo-cart";
const FAV_KEY = "tugo-favs";

type Overlay = "none" | "nav" | "search" | "cart";

type SiteCtx = {
  catalog: LiteCatalog;
  productById: Map<string, LiteProduct>;
  cart: CartLine[];
  cartReady: boolean;
  cartCount: number;
  addToCart: (p: LiteProduct, color: string, size: string, qty: number) => void;
  setQty: (key: string, delta: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  favs: string[];
  toggleFav: (id: string) => void;
  overlay: Overlay;
  openOverlay: (o: Exclude<Overlay, "none">) => void;
  closeOverlay: () => void;
  /** 點覆蓋層內連結換頁時用：關閉但不 history.back()，避免打斷導航 */
  closeForNav: () => void;
  toast: string;
  showToast: (t: string) => void;
};

const Ctx = createContext<SiteCtx | null>(null);

export function useSite() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSite 必須在 SiteProvider 內使用");
  return v;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    // 私密模式 / 容量滿：忽略
  }
}

function sanitizeCart(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c) => c && typeof c.id === "string" && typeof c.qty === "number")
    .map((c) => ({
      id: String(c.id),
      color: String(c.color ?? ""),
      size: String(c.size ?? ""),
      qty: Math.max(1, Math.min(10, Math.floor(c.qty))),
      key: cartKey(String(c.id), String(c.color ?? ""), String(c.size ?? "")),
    }));
}

export function SiteProvider({ catalog, children }: { catalog: LiteCatalog; children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);
  const [overlay, setOverlay] = useState<Overlay>("none");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pathname = usePathname();

  const productById = useMemo(() => new Map(catalog.products.map((p) => [p.id, p])), [catalog.products]);

  // 讀 localStorage（只在 client）
  useEffect(() => {
    setCart(sanitizeCart(readJSON(CART_KEY, [])));
    const f = readJSON<unknown>(FAV_KEY, []);
    setFavs(Array.isArray(f) ? f.filter((x): x is string => typeof x === "string") : []);
    setCartReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setCart(sanitizeCart(readJSON(CART_KEY, [])));
      if (e.key === FAV_KEY) setFavs(readJSON<string[]>(FAV_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commitCart = useCallback((updater: (c: CartLine[]) => CartLine[]) => {
    setCart((prev) => {
      const next = updater(prev);
      writeJSON(CART_KEY, next);
      return next;
    });
  }, []);

  const showToast = useCallback((t: string) => {
    clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const addToCart = useCallback(
    (p: LiteProduct, color: string, size: string, qty: number) => {
      const key = cartKey(p.id, color, size);
      commitCart((c) =>
        c.some((l) => l.key === key)
          ? c.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, 10) } : l))
          : [...c, { key, id: p.id, color, size, qty: Math.min(qty, 10) }],
      );
      if (ADD_TO_CART === "drawer") setOverlay("cart");
      else showToast(`已加入購物車：${p.name}`);
    },
    [commitCart, showToast],
  );

  const setQty = useCallback(
    (key: string, d: number) =>
      commitCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.max(1, Math.min(10, l.qty + d)) } : l))),
    [commitCart],
  );
  const removeLine = useCallback((key: string) => commitCart((c) => c.filter((l) => l.key !== key)), [commitCart]);
  const clearCart = useCallback(() => commitCart(() => []), [commitCart]);

  const toggleFav = useCallback((id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      writeJSON(FAV_KEY, next);
      return next;
    });
  }, []);

  // ---- 覆蓋層：鎖背景捲動、Esc 關閉、Android 返回鍵關閉 ----
  const overlayRef = useRef<Overlay>("none");
  const pushedRef = useRef(false);
  const openOverlay = useCallback((o: Exclude<Overlay, "none">) => {
    setOverlay(o);
  }, []);
  const closeOverlay = useCallback(() => {
    setOverlay("none");
  }, []);
  const closeForNav = useCallback(() => {
    pushedRef.current = false;
    setOverlay("none");
  }, []);

  useEffect(() => {
    const prev = overlayRef.current;
    overlayRef.current = overlay;
    const html = document.documentElement;
    if (overlay !== "none") {
      html.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      // 首次開啟時推一筆 history，讓手機「返回」先關覆蓋層而不是離開頁面
      if (prev === "none" && !pushedRef.current) {
        try {
          window.history.pushState({ ...(window.history.state ?? {}), tugoOverlay: true }, "");
          pushedRef.current = true;
        } catch {
          // ignore
        }
      }
    } else {
      html.style.overflow = "";
      document.body.style.overflow = "";
      if (pushedRef.current) {
        pushedRef.current = false;
        if (window.history.state?.tugoOverlay) window.history.back();
      }
    }
  }, [overlay]);

  useEffect(() => {
    const onPop = () => {
      if (pushedRef.current && overlayRef.current !== "none") {
        pushedRef.current = false;
        setOverlay("none");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlayRef.current !== "none") setOverlay("none");
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // 換頁：關閉所有覆蓋層（history 那筆已被新頁面取代，不再 back）
  useEffect(() => {
    pushedRef.current = false;
    setOverlay("none");
  }, [pathname]);

  const cartCount = cart.reduce((t, l) => t + l.qty, 0);

  const value = useMemo<SiteCtx>(
    () => ({
      catalog,
      productById,
      cart,
      cartReady,
      cartCount,
      addToCart,
      setQty,
      removeLine,
      clearCart,
      favs,
      toggleFav,
      overlay,
      openOverlay,
      closeOverlay,
      closeForNav,
      toast,
      showToast,
    }),
    [catalog, productById, cart, cartReady, cartCount, addToCart, setQty, removeLine, clearCart, favs, toggleFav, overlay, openOverlay, closeOverlay, closeForNav, toast, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
