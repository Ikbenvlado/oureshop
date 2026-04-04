"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, ShoppingCart, ArrowLeft, Package, CheckCircle, Heart, X, ZoomIn, Send } from "lucide-react";
import { Product } from "@/lib/products";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect } from "react";

function mapProduct(row: any): Product {
  return { ...row, inStock: row.inStock ?? row.in_stock, discount: row.discount ?? null, stock: row.stock ?? null, sku: row.sku ?? "" };
}

export default function ProductPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useUserAuth();
  const { t, tCat, lang } = useLanguage();
  const [added, setAdded] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState<any[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products?id=${id}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (!data) { setLoading(false); return; }
        const prod = mapProduct(data);
        setProduct(prod);
        const relRes = await fetch(`/api/products?category=${encodeURIComponent(prod.category)}&excludeId=${prod.id}&limit=3`);
        const relData = await relRes.json();
        setRelated((relData ?? []).map(mapProduct));
        const revRes = await fetch(`/api/reviews?productId=${prod.id}`);
        const revData = await revRes.json();
        setApprovedReviews(revData ?? []);
        setLoading(false);
      });
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    const ok = addItem(product);
    if (!ok) { showToast(t("product_maxStock"), "info"); return; }
    showToast(`„${product.name}" ${t("product_added")}`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  useEffect(() => {
    if (user && approvedReviews.length >= 0 && product) {
      fetch(`/api/reviews?productId=${product.id}`)
        .then((r) => r.json())
        .then((data) => {
          const all: any[] = data ?? [];
          setApprovedReviews(all);
        });
    }
  }, [user, product?.id]);

  useEffect(() => {
    if (user && approvedReviews.length > 0) {
      setHasReviewed(approvedReviews.some((r: any) => r.userId === (user as any).id));
    }
  }, [user, approvedReviews]);

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) return;
    setReviewSubmitting(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product!.id, rating: reviewRating, comment: reviewComment }),
    });
    const data = await res.json();
    if (res.status === 201) {
      showToast("Recenzia odoslaná! Čaká na schválenie.", "success");
      setHasReviewed(true);
      setReviewComment("");
    } else {
      showToast(data.error || "Nastala chyba.", "error");
    }
    setReviewSubmitting(false);
  };

  const handleFavorite = () => {
    if (!product) return;
    if (!user) { showToast(t("products_loginForFavorites"), "info"); return; }
    toggleFavorite(product.id);
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-5 w-48 bg-gray-200 dark:bg-[#1a1826] rounded-full animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="h-96 lg:h-125 rounded-3xl bg-gray-200 dark:bg-[#1a1826] animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-9 w-3/4 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-[#1a1826] rounded-full animate-pulse" />
            <div className="h-4 w-full bg-gray-200 dark:bg-[#1a1826] rounded-full animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-[#1a1826] rounded-full animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-200 dark:bg-[#1a1826] rounded-full animate-pulse" />
            <div className="h-40 rounded-2xl bg-gray-200 dark:bg-[#1a1826] animate-pulse mt-4" />
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-400 text-xl">{t("product_notFound")}</p>
        <Link href="/" className="text-purple-600 hover:underline mt-4 inline-block">{t("product_backToProducts")}</Link>
      </main>
    );
  }

  const displayName = lang === "en" && product.nameEn ? product.nameEn : product.name;
  const displayDescription = lang === "en" && product.descriptionEn ? product.descriptionEn : product.description;
  const discounted = product.discount ? product.price * (1 - product.discount / 100) : null;
  const fav = isFavorite(product.id);
  const isOutOfStock = !product.inStock || product.stock === 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8 flex-wrap">
        <Link href="/" className="inline-flex items-center gap-1.5 hover:text-purple-600 transition-colors">
          <ArrowLeft size={14} />
          {t("product_home")}
        </Link>
        <span>/</span>
        <Link href={`/?category=${encodeURIComponent(product.category)}`} className="hover:text-purple-600 transition-colors">
          {tCat(product.category)}
        </Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-300 font-medium line-clamp-1 max-w-xs">{displayName}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Image */}
        <div
          className="relative h-96 lg:h-125 rounded-3xl overflow-hidden bg-purple-50 dark:bg-[#1a1826] shadow-xl shadow-purple-100 dark:shadow-none cursor-zoom-in group"
          onClick={() => setZoomOpen(true)}
          role="button"
          aria-label={t("product_viewCart")}
        >
          <Image
            src={product.image}
            alt={displayName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute top-4 right-4 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn size={16} />
          </div>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-gray-900 text-white px-5 py-2 rounded-full font-semibold tracking-wide">
                {t("products_outOfStock")}
              </span>
            </div>
          )}
          <span className="absolute top-4 left-4 bg-white/90 dark:bg-black/60 backdrop-blur-sm text-purple-700 dark:text-purple-300 text-sm font-semibold px-3 py-1.5 rounded-full shadow">
            {tCat(product.category)}
          </span>
          {product.discount && (
            <span className="absolute top-4 left-4 mt-10 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
              -{product.discount}%
            </span>
          )}
        </div>

        {/* Lightbox */}
        {zoomOpen && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setZoomOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
              aria-label={t("minicart_close")}
            >
              <X size={24} />
            </button>
            <div className="relative w-full max-w-4xl max-h-[90vh] aspect-square" onClick={(e) => e.stopPropagation()}>
              <Image
                src={product.image}
                alt={displayName}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          </div>
        )}

        {/* Details */}
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
              {displayName}
            </h1>
            <button
              onClick={handleFavorite}
              className="shrink-0 mt-1 p-2 rounded-full border border-gray-200 dark:border-gray-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label={fav ? t("products_removeFromFavorites") : t("products_addToFavorites")}
            >
              <Heart size={20} className={fav ? "fill-red-500 text-red-500" : "text-gray-400"} />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={i < Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 dark:text-gray-600"}
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              {product.rating} · {product.reviews} {t("product_rating")}
            </span>
          </div>

          {product.sku && (
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-6">
              {t("product_code")}: {product.sku}
            </p>
          )}

          <p className="text-gray-500 dark:text-gray-300 leading-relaxed mb-8 text-sm">{displayDescription}</p>

          <div className="flex items-center gap-2 mb-6">
            {isOutOfStock ? (
              <>
                <Package size={16} className="text-red-400" />
                <span className="text-sm font-semibold text-red-500">{t("product_outOfStock")}</span>
              </>
            ) : product.stock != null && product.stock <= 5 ? (
              <>
                <Package size={16} className="text-orange-400" />
                <span className="text-sm font-semibold text-orange-500">{t("product_veryLowStock", { n: product.stock })}</span>
              </>
            ) : product.stock != null && product.stock <= 10 ? (
              <>
                <CheckCircle size={16} className="text-amber-500" />
                <span className="text-sm font-semibold text-amber-600">{t("product_lowStock", { n: product.stock })}</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm font-semibold text-green-600">{t("product_inStock")}</span>
              </>
            )}
          </div>

          <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-[#1e1a35] dark:to-[#1a1530] rounded-2xl p-6 border border-purple-100 dark:border-[#2d2a45] text-center">
            {discounted ? (
              <div className="flex items-baseline justify-center gap-3 mb-5">
                <span className="text-4xl font-extrabold gradient-text">{discounted.toFixed(2)} €</span>
                <span className="text-xl text-gray-400 dark:text-gray-500 line-through">{product.price.toFixed(2)} €</span>
              </div>
            ) : (
              <div className="text-4xl font-extrabold gradient-text mb-5">
                {product.price.toFixed(2)} €
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isOutOfStock}
              className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-base font-bold transition-all shadow-lg ${
                added
                  ? "bg-green-500 text-white shadow-green-200 dark:shadow-green-900/40"
                  : !isOutOfStock
                  ? "gradient-btn text-white shadow-purple-200 dark:shadow-purple-900/40"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed shadow-none"
              }`}
            >
              <ShoppingCart size={20} />
              {added ? t("product_added") : t("product_addToCart")}
            </button>

            <Link
              href="/cart"
              className="block text-center mt-3 text-sm text-purple-600 hover:underline font-medium"
            >
              {t("product_viewCart")}
            </Link>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-16">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
          {lang === "en" ? "Customer Reviews" : "Recenzie zákazníkov"}
          {approvedReviews.length > 0 && <span className="ml-2 text-base font-normal text-gray-400">({approvedReviews.length})</span>}
        </h2>

        {/* Approved reviews list */}
        {approvedReviews.length > 0 ? (
          <div className="space-y-4 mb-8">
            {approvedReviews.map((r: any) => (
              <div key={r.id} className="bg-white dark:bg-[#1a1826] rounded-2xl p-5 border border-purple-50 dark:border-[#2d2a45] shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-700 dark:text-purple-300 text-xs font-bold">
                      {(r.user?.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{r.user?.name || "Zákazník"}</p>
                      <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("sk-SK")}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200 dark:text-gray-600"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm mb-8">{lang === "en" ? "No reviews yet." : "Zatiaľ žiadne recenzie."}</p>
        )}

        {/* Review form */}
        {user ? (
          hasReviewed ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                {lang === "en" ? "Your review has been submitted and is awaiting approval." : "Tvoja recenzia bola odoslaná a čaká na schválenie."}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a1826] rounded-2xl p-6 border border-purple-50 dark:border-[#2d2a45] shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                {lang === "en" ? "Write a review" : "Napísať recenziu"}
              </h3>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{lang === "en" ? "Rating" : "Hodnotenie"}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setReviewRating(star)} onMouseEnter={() => setReviewHover(star)} onMouseLeave={() => setReviewHover(0)}>
                      <Star size={28} className={(reviewHover || reviewRating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-200 dark:text-gray-600"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{lang === "en" ? "Your review" : "Tvoja recenzia"}</p>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder={lang === "en" ? "Share your experience with this product..." : "Podeľ sa o skúsenosť s týmto produktom..."}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-[#2d2a45] rounded-xl text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-[#14121f] focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting || !reviewComment.trim()}
                className="flex items-center gap-2 px-6 py-3 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={15} />
                {reviewSubmitting ? (lang === "en" ? "Sending..." : "Odosiela sa...") : (lang === "en" ? "Submit review" : "Odoslať recenziu")}
              </button>
            </div>
          )
        ) : (
          <div className="bg-purple-50 dark:bg-[#1e1a35] rounded-2xl p-5 text-center border border-purple-100 dark:border-[#2d2a45]">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {lang === "en" ? "Sign in to write a review." : "Prihlás sa, aby si mohol napísať recenziu."}
            </p>
            <Link href="/login" className="inline-block px-5 py-2.5 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200">
              {lang === "en" ? "Sign in" : "Prihlásiť sa"}
            </Link>
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
            {t("product_related")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((p) => {
              const relDiscounted = p.discount ? p.price * (1 - p.discount / 100) : null;
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="bg-white dark:bg-[#1a1826] rounded-2xl overflow-hidden border border-purple-50 dark:border-[#2d2a45] shadow-sm card-hover"
                >
                  <div className="relative h-40 bg-purple-50 dark:bg-[#14121f]">
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="33vw" />
                    {p.discount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        -{p.discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm line-clamp-1">{p.name}</p>
                    {relDiscounted ? (
                      <div className="mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500 line-through">{p.price.toFixed(2)} €</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="gradient-text font-extrabold text-base">{relDiscounted.toFixed(2)} €</span>
                          <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">-{p.discount}%</span>
                        </div>
                      </div>
                    ) : (
                      <p className="gradient-text font-extrabold text-base mt-1">{p.price.toFixed(2)} €</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
