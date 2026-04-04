"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";

export default function MiniCart() {
  const { items, cartOpen, closeCart, removeItem, updateQuantity, totalPrice } = useCart();
  const { t } = useLanguage();

  if (!cartOpen) return null;

  const shipping = totalPrice >= 50 ? 0 : 3.99;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeCart} />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col"
        style={{ animation: "slideInRight 0.25s ease-out" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
            {t("minicart_title")}
            {items.length > 0 && (
              <span className="ml-2 text-sm font-semibold text-gray-400">({items.length})</span>
            )}
          </h2>
          <button onClick={closeCart}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={t("minicart_close")}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingBag size={48} className="text-purple-200 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t("minicart_empty")}</p>
              <button onClick={closeCart} className="mt-4 text-sm text-purple-600 hover:underline">
                {t("cart_continueShopping")}
              </button>
            </div>
          ) : (
            items.map((item) => {
              const discounted = item.discount ? item.price * (1 - item.discount / 100) : null;
              return (
                <div key={item.id} className="flex gap-3">
                  <Link href={`/products/${item.id}`} onClick={closeCart}
                    className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-purple-50 dark:bg-gray-700">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.id}`} onClick={closeCart}>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 line-clamp-1 hover:text-purple-600">{item.name}</p>
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {discounted ? (
                        <>
                          <span className="text-xs text-gray-400 line-through">{item.price.toFixed(2)} €</span>
                          <span className="text-sm font-bold gradient-text">{discounted.toFixed(2)} €</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold gradient-text">{item.price.toFixed(2)} €</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-full px-2 py-0.5">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-gray-700 text-gray-500 transition-colors">
                          <Minus size={10} />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-gray-800 dark:text-gray-100">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.stock != null && item.quantity >= item.stock}
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white dark:hover:bg-gray-700 text-gray-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                          <Plus size={10} />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{t("minicart_subtotal")}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{t("minicart_shipping")}</span>
              <span className={shipping === 0 ? "text-green-600 font-semibold" : "font-medium text-gray-800 dark:text-gray-100"}>
                {shipping === 0 ? t("minicart_free") : `${shipping.toFixed(2)} €`}
              </span>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-purple-500">
                {t("minicart_missing", { amount: (50 - totalPrice).toFixed(2) })}
              </p>
            )}
            <Link href="/checkout" onClick={closeCart}
              className="block w-full text-center py-3.5 gradient-btn text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200">
              {t("minicart_order")} — {(totalPrice + shipping).toFixed(2)} €
            </Link>
            <Link href="/cart" onClick={closeCart}
              className="block w-full text-center py-2.5 border border-purple-100 dark:border-gray-600 text-purple-600 dark:text-purple-400 rounded-2xl font-semibold text-sm hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors">
              {t("minicart_viewCart")}
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
