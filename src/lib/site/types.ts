// 前台共用型別（server / client 皆可 import）。欄位對應 tugo schema（README §6）。
export type ProductStatus = "instock" | "limited" | "preorder" | "soldout";

export type Category = { id: string; name: string; sort: number };

export type Artist = {
  id: string;
  name: string;
  name_en: string | null;
  discipline: string | null;
  tags: string[];
  tagline: string | null;
  bio: string | null;
  philosophy: string | null;
  instagram: string | null;
  city: string | null;
  hue: number;
  portrait_url: string | null;
  cover_url: string | null;
  sort: number;
};

export type Collection = {
  id: string;
  name: string;
  name_en: string | null;
  season: string | null;
  concept: string | null;
  description: string | null;
  hue: number;
  cover_url: string | null;
  sort: number;
  artist_ids: string[];
};

export type ProductImage = { url: string; label: string | null; sort: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  artist_id: string;
  category_id: string;
  collection_id: string | null;
  price: number;
  status: ProductStatus;
  ship_date: string | null;
  is_new: boolean;
  popularity: number;
  released_at: string;
  colors: string[];
  sizes: string[];
  stock: number;
  material: string | null;
  care: string | null;
  dimensions: string | null;
  story: string | null;
  hue: number;
  images: ProductImage[];
};

export type Catalog = {
  categories: Category[];
  artists: Artist[];
  collections: Collection[];
  products: Product[];
  swatches: Record<string, string>;
};

/** 給 client（搜尋、購物車、Header）用的精簡目錄，不含長文。 */
export type LiteProduct = Pick<
  Product,
  "id" | "slug" | "name" | "artist_id" | "category_id" | "price" | "status" | "ship_date" | "colors" | "sizes" | "hue" | "is_new"
> & { image: string | null };
export type LiteArtist = Pick<Artist, "id" | "name" | "name_en" | "discipline" | "hue" | "portrait_url">;
export type LiteCategory = Category & { count: number; hue: number; image: string | null };
export type LiteCatalog = { products: LiteProduct[]; artists: LiteArtist[]; categories: LiteCategory[] };

export type CartLine = { key: string; id: string; color: string; size: string; qty: number };
