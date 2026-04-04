"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { Product } from "@/lib/products";
import { useToast } from "@/context/ToastContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function ProductCard({ product }: { product: Product }) {
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useUserAuth();
  const { t, tCat, lang } = useLanguage();

  const displayName = lang === "en" && product.nameEn ? product.nameEn : product.name;
  const discounted = product.discount ? product.price * (1 - product.discount / 100) : null;

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      showToast(t("products_loginForFavorites"), "info");
      return;
    }
    toggleFavorite(product.id);
  };

  const fav = isFavorite(product.id);

  return (
    <div className="bg-white dark:bg-[#1a1826] rounded-2xl overflow-hidden card-hover border border-purple-50 dark:border-[#2d2a45] shadow-sm">
      <Link href={`/products/${product.id}`}>
        <div className="relative h-52 overflow-hidden bg-purple-50 dark:bg-[#14121f]">
          <Image
            src={product.image}
            alt={displayName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {(!product.inStock || product.stock === 0) && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wide">
                {t("products_outOfStock")}
              </span>
            </div>
          )}
          <span className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 backdrop-blur-sm text-purple-700 dark:text-purple-300 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {tCat(product.category)}
          </span>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/products/${product.id}`} className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 hover:text-purple-600 transition-colors line-clamp-1 text-sm">
              {displayName}
            </h3>
          </Link>
          <button
            onClick={handleFavorite}
            className="shrink-0 p-1 rounded-full hover:bg-red-50 transition-colors"
            aria-label={fav ? t("products_removeFromFavorites") : t("products_addToFavorites")}
          >
            <Heart
              size={16}
              className={fav ? "fill-red-500 text-red-500" : "text-gray-300"}
            />
          </button>
        </div>

        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 dark:text-gray-600"}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">({product.reviews})</span>
          {product.stock != null && product.stock > 0 && product.stock <= 10 && (
            <>
              <span className="text-gray-300 dark:text-gray-600 text-xs">·</span>
              <span className={`text-xs font-semibold ${product.stock <= 5 ? "text-orange-500" : "text-amber-500"}`}>
                {product.stock <= 5 ? `⚠ ${product.stock} ks` : `${product.stock} ks`}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div>
            {discounted ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold gradient-text">{discounted.toFixed(2)} €</span>
                <span className="text-sm text-gray-400 line-through">{product.price.toFixed(2)} €</span>
              </div>
            ) : (
              <span className="text-lg font-extrabold gradient-text">{product.price.toFixed(2)} €</span>
            )}
          </div>
          {product.discount && (
            <span className="text-xs font-bold bg-red-500 text-white px-2.5 py-1 rounded-full">
              -{product.discount}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
