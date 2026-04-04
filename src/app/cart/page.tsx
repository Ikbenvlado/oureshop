"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const { showToast } = useToast();
  const { t, tCat } = useLanguage();

  const handleRemove = (id: number, name: string) => {
    removeItem(id);
    showToast(`'${name}' removed.`, "info");
  };

  if (items.length === 0) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-purple-50 dark:bg-[#1e1a35] mb-6">
          <ShoppingBag size={40} className="text-purple-300" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">{t("cart_empty")}</h1>
        <p className="text-gray-400 mb-8">{t("cart_emptyDesc")}</p>
        <Link href="/"
          className="inline-flex items-center gap-2 px-6 py-3 gradient-btn text-white rounded-2xl font-semibold shadow-lg shadow-purple-200 dark:shadow-purple-900/40">
          <ArrowLeft size={18} />
          {t("cart_continueShopping")}
        </Link>
      </main>
    );
  }

  const shipping = totalPrice >= 50 ? 0 : 3.99;
  const total = totalPrice + shipping;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">
        {t("cart_title")}
        <span className="ml-3 text-lg font-semibold text-gray-400">({items.length})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={item.id}
              className="flex gap-4 bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-4 hover:shadow-md hover:border-purple-100 dark:hover:border-purple-800/50 transition-all">
              <Link href={`/products/${item.id}`} className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-purple-50 dark:bg-[#14121f]">
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.id}`}>
                  <h3 className="font-bold text-gray-900 dark:text-white hover:text-purple-600 transition-colors text-sm line-clamp-1">{item.name}</h3>
                </Link>
                <p className="text-xs text-gray-400 mt-0.5">{tCat(item.category)}</p>
                {item.discount ? (
                  <div className="mt-1">
                    <span className="text-xs text-gray-400 dark:text-gray-500 line-through mr-1">{item.price.toFixed(2)} €</span>
                    <span className="gradient-text font-extrabold text-sm">
                      {(item.price * (1 - item.discount / 100)).toFixed(2)} {t("cart_perUnit")}
                    </span>
                  </div>
                ) : (
                  <p className="gradient-text font-extrabold mt-1 text-sm">{item.price.toFixed(2)} {t("cart_perUnit")}</p>
                )}
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => handleRemove(item.id, item.name)} className="text-gray-300 dark:text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-2 bg-purple-50 dark:bg-[#14121f] rounded-full px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-[#2d2a45] hover:text-purple-600 transition-colors text-gray-500 dark:text-gray-400">
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center font-bold text-gray-800 dark:text-gray-200 text-sm">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.stock != null && item.quantity >= item.stock}
                    className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors text-gray-500 dark:text-gray-400 ${
                      item.stock != null && item.quantity >= item.stock ? "opacity-30 cursor-not-allowed" : "hover:bg-white dark:hover:bg-[#2d2a45] hover:text-purple-600"
                    }`}>
                    <Plus size={12} />
                  </button>
                </div>
                <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                  {((item.discount ? item.price * (1 - item.discount / 100) : item.price) * item.quantity).toFixed(2)} €
                </span>
              </div>
            </div>
          ))}
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-600 mt-2 transition-colors">
            <ArrowLeft size={14} />
            {t("cart_continueShopping")}
          </Link>
        </div>

        <div className="h-fit sticky top-24">
          <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-100 dark:border-[#2d2a45] shadow-sm p-6 mb-4">
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-5">{t("checkout_summary")}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>{t("cart_subtotal")}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{totalPrice.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>{t("cart_shipping")}</span>
                <span className={shipping === 0 ? "text-green-600 font-semibold" : "font-medium text-gray-800 dark:text-gray-200"}>
                  {shipping === 0 ? t("cart_shippingFree") : `${shipping.toFixed(2)} €`}
                </span>
              </div>
              <div className="rounded-xl bg-gray-50 dark:bg-[#14121f] p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-600 dark:text-gray-400">
                    <Truck size={13} />
                    {shipping === 0 ? (
                      <span className="text-green-600">{t("cart_freeShipping")}</span>
                    ) : (
                      <span>{t("cart_shippingMissing", { amount: (50 - totalPrice).toFixed(2) })}</span>
                    )}
                  </div>
                  <span className="text-gray-400">50 €</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-[#2d2a45] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((totalPrice / 50) * 100, 100)}%`,
                      background: shipping === 0 ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #7c3aed, #ec4899)",
                    }}
                  />
                </div>
              </div>
              <div className="border-t border-purple-50 dark:border-[#2d2a45] pt-3 flex justify-between font-extrabold text-gray-900 dark:text-white text-base">
                <span>{t("cart_total")}</span>
                <span className="gradient-text">{total.toFixed(2)} €</span>
              </div>
            </div>
            <Link href="/checkout"
              className="block w-full text-center mt-6 py-4 gradient-btn text-white rounded-2xl font-bold shadow-lg shadow-purple-200 dark:shadow-purple-900/40 hover:opacity-90 transition-opacity">
              {t("cart_checkout")}
            </Link>
          </div>
          <p className="text-xs text-center text-gray-400">{t("cart_secureInfo")}</p>
        </div>
      </div>
    </main>
  );
}
