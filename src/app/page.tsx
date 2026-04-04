"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/products";
import { Search, Sparkles, ArrowUpDown } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const PAGE_SIZE = 8;
const ALL_CATEGORY = "__ALL__";

type SortOption = "default" | "price-asc" | "price-desc" | "rating" | "name";

function mapProduct(row: any): Product {
  return { ...row, inStock: row.inStock ?? row.in_stock, discount: row.discount ?? null, stock: row.stock ?? null, sku: row.sku ?? "" };
}

export default function HomePage() {
  return (
    <Suspense>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, tCat, lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([ALL_CATEGORY]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState(() => searchParams.get("category") ?? ALL_CATEGORY);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("default");
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const prods = (data ?? []).map(mapProduct);
        setProducts(prods);
        const cats: string[] = [ALL_CATEGORY, ...Array.from(new Set(prods.map((p: Product) => p.category))) as string[]];
        setCategories(cats);
        setProductsLoading(false);
      });
  }, []);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    const params = new URLSearchParams(searchParams.toString());
    if (cat === ALL_CATEGORY) { params.delete("category"); } else { params.set("category", cat); }
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [activeCategory, search, sort]);

  const sortLabels: Record<SortOption, string> = {
    default: t("sort_default"),
    "price-asc": t("sort_priceAsc"),
    "price-desc": t("sort_priceDesc"),
    rating: t("sort_rating"),
    name: t("sort_name"),
  };

  const filtered = products
    .filter((p) => {
      const matchCategory = activeCategory === ALL_CATEGORY || p.category === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "name") return a.name.localeCompare(b.name, lang === "sk" ? "sk" : "en");
      return 0;
    });

  const displayed = filtered.slice(0, visible);

  const countLabel = productsLoading
    ? t("products_loading")
    : `${displayed.length} / ${filtered.length} ${
        filtered.length === 1 ? t("products_singular") : t("products_plural")
      }`;

  return (
    <main>
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-linear-to-br from-violet-600 via-purple-600 to-pink-500 dark:from-[#1a0a2e] dark:via-[#1e0a3c] dark:to-[#2d0a4e]" />
        <div className="absolute inset-0 opacity-20 dark:opacity-10"
          style={{backgroundImage: "radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)"}}
        />
        <img
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15 dark:opacity-10 mix-blend-overlay"
        />
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles size={15} />
            {t("hero_badge")}
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-5 leading-tight">
            {t("hero_title1")}
            <br />
            <span className="text-yellow-300">{t("hero_title2")}</span>
          </h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">{t("hero_subtitle")}</p>
          <div className="relative max-w-md mx-auto">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t("hero_search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-5 py-4 rounded-2xl bg-white dark:bg-[#1a1826] text-gray-800 dark:text-gray-200 shadow-xl dark:shadow-black/30 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 dark:focus:ring-purple-500 text-sm font-medium border border-transparent dark:border-[#2d2a45]"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((cat) => (
            <button key={cat} onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? "gradient-btn text-white shadow-md shadow-purple-200 dark:shadow-purple-900/40"
                  : "bg-white dark:bg-[#1a1826] text-gray-600 dark:text-gray-300 border border-purple-100 dark:border-[#2d2a45] hover:border-purple-300 hover:text-purple-600"
              }`}>
              {cat === ALL_CATEGORY ? t("products_all") : tCat(cat)}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <p className="text-sm text-gray-400">{countLabel}</p>
          <div className="relative flex items-center gap-2">
            <ArrowUpDown size={15} className="text-gray-400 shrink-0" />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}
              className="appearance-none bg-white dark:bg-[#1a1826] border border-purple-100 dark:border-[#2d2a45] text-sm font-semibold text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer hover:border-purple-300 transition-colors">
              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <option key={key} value={key}>{sortLabels[key]}</option>
              ))}
            </select>
          </div>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1a1826] rounded-2xl h-72 animate-pulse border border-purple-50 dark:border-[#2d2a45]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 text-lg">{t("products_none")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayed.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="text-center mt-10">
                <button onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  className="px-8 py-3.5 gradient-btn text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 dark:shadow-purple-900/40">
                  {t("products_loadMore")} ({filtered.length - visible})
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
