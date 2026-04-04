"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { User, ShoppingBag, MapPin, Trash2, Plus, CheckCircle, AlertCircle, X, Package, Heart, Phone, RefreshCw } from "lucide-react";
import { useUserAuth, UserOrder } from "@/context/UserAuthContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useLanguage } from "@/context/LanguageContext";
import { Product } from "@/lib/products";

type Tab = "profil" | "objednavky" | "adresy" | "oblubene";

const statusStyle: Record<string, string> = {
  nová: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  spracovaná: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  doručená: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  zrušená: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function AccountPage() {
  const { user, loading, logout, updateProfile, addAddress, removeAddress, refreshUser } = useUserAuth();
  const { toggleFavorite } = useFavorites();
  const { t, tCat, lang } = useLanguage();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profil");
  const [detailOrder, setDetailOrder] = useState<UserOrder | null>(null);

  // Profile form
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [phoneError, setPhoneError] = useState("");

  // Address form
  const [addrForm, setAddrForm] = useState({ label: "", street: "", city: "", zip: "" });
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrError, setAddrError] = useState("");

  // Refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    if (tab === "oblubene") {
      const res = await fetch("/api/user/favorites?withProducts=true");
      const data = await res.json();
      setFavProducts((data ?? []).map((p: any) => ({ ...p, inStock: p.inStock ?? p.in_stock, discount: p.discount ?? null })));
    }
    setRefreshing(false);
  };

  // Favorites
  const [favProducts, setFavProducts] = useState<Product[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else {
      setProfile((p) => ({ ...p, name: user.name, email: user.email, phone: user.phone }));
    }
  }, [user, router]);

  useEffect(() => {
    if (tab !== "oblubene" || !user) return;
    setFavLoading(true);
    fetch("/api/user/favorites?withProducts=true")
      .then((res) => res.json())
      .then((data) => {
        const prods = (data ?? []).map((p: any) => ({
          ...p,
          inStock: p.inStock ?? p.in_stock,
          discount: p.discount ?? null,
        }));
        setFavProducts(prods);
        setFavLoading(false);
      });
  }, [tab, user]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (!user) return null;

  const phoneRegex = /^(\+|00)?[0-9][0-9\s\-]{6,18}[0-9]$/;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile.phone && !phoneRegex.test(profile.phone.trim())) {
      setPhoneError(lang === "en" ? "Enter a valid phone number (e.g. +421 900 123 456)" : "Zadajte platné telefónne číslo (napr. +421 900 123 456)");
      return;
    }
    setPhoneError("");
    const err = await updateProfile(profile.name, profile.email, profile.phone);
    if (err) {
      setProfileMsg({ ok: false, text: err });
    } else {
      setProfileMsg({ ok: true, text: t("account_saved") });
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const zipRegex = /^\d{3}\s?\d{2}$/;

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.street || !addrForm.city || !addrForm.zip) return;
    if (!zipRegex.test(addrForm.zip)) { setAddrError(t("account_zipError")); return; }
    setAddrError("");
    const err = await addAddress({ label: addrForm.label || t("account_addressLabelPh"), street: addrForm.street, city: addrForm.city, zip: addrForm.zip });
    if (err) {
      setAddrError(err);
    } else {
      setAddrForm({ label: "", street: "", city: "", zip: "" });
      setShowAddrForm(false);
    }
  };

  const handleRemoveFav = async (productId: number) => {
    await toggleFavorite(productId);
    setFavProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      nová: t("account_status_new"),
      spracovaná: t("account_status_processing"),
      doručená: t("account_status_delivered"),
      zrušená: t("account_status_cancelled"),
    };
    return map[status] ?? status;
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profil", label: t("account_profile"), icon: User },
    { key: "objednavky", label: t("account_orders"), icon: ShoppingBag },
    { key: "adresy", label: t("account_addresses"), icon: MapPin },
    { key: "oblubene", label: t("account_favorites"), icon: Heart },
  ];

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 dark:border-[#2d2a45] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-[#14121f] placeholder-gray-400 dark:placeholder-gray-600";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full gradient-btn flex items-center justify-center text-white text-xl font-extrabold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{user.name}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
            {user.customerSeq && (
              <span className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 tracking-wide">
                OS-{user.customerSeq}
              </span>
            )}
          </div>
        </div>
        <button onClick={() => { logout(); router.push("/"); }}
          className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#2d2a45] rounded-xl hover:border-red-300 hover:text-red-500 transition-colors">
          {t("account_logout")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 mb-6 bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-1.5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key ? "gradient-btn text-white shadow-md" : "text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
            }`}>
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab: Profil */}
      {tab === "profil" && (
        <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-6">
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6">{t("account_personalInfo")}</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={labelClass}>{t("account_name")}</label>
                <input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className={inputClass} placeholder={t("account_namePh")} />
              </div>
              <div>
                <label className={labelClass}>{t("account_email")}</label>
                <input required type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className={inputClass} placeholder={t("account_emailPh")} />
              </div>
              <div>
                <label className={labelClass}>{t("account_phone")}</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={profile.phone}
                    onChange={(e) => { setProfile({ ...profile, phone: e.target.value }); setPhoneError(""); }}
                    className={`${inputClass} pl-10 ${phoneError ? "border-red-400 focus:ring-red-300" : ""}`}
                    placeholder={t("account_phonePh")} />
                </div>
                {phoneError && (
                  <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
                    <AlertCircle size={12} />
                    {phoneError}
                  </p>
                )}
              </div>
            </div>

            {profileMsg && (
              <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl ${
                profileMsg.ok
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/40 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400"
              }`}>
                {profileMsg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                {profileMsg.text}
              </div>
            )}

            <button type="submit"
              className="px-6 py-3 gradient-btn text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 dark:shadow-purple-900/40">
              {t("account_save")}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Objednávky */}
      {tab === "objednavky" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {t("account_refresh")}
            </button>
          </div>
          {user.orders.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-12 text-center">
              <ShoppingBag size={40} className="mx-auto text-purple-200 mb-3" />
              <p className="text-gray-400 font-medium">{t("account_noOrders")}</p>
            </div>
          ) : (
            user.orders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs text-gray-400 font-medium">{order.id}</span>
                    <p className="text-xs text-gray-400 mt-0.5">{order.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[order.status] ?? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                      {statusLabel(order.status)}
                    </span>
                    <span className="font-extrabold gradient-text whitespace-nowrap">{order.total.toFixed(2)} €</span>
                    <button
                      onClick={() => setDetailOrder(order)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-[#1e1a35] rounded-lg transition-colors"
                      title={t("account_orderId")}
                    >
                      <Package size={15} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 mt-3">
                  {order.items.slice(0, 2).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>{item.name} × {item.quantity}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{(item.price * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-xs text-gray-400">{t("account_moreItems", { n: order.items.length - 2 })}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Adresy */}
      {tab === "adresy" && (
        <div className="space-y-4">
          {user.addresses.map((addr) => (
            <div key={addr.id} className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-5 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{addr.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{addr.street}</p>
                  <p className="text-sm text-gray-400">{addr.zip} {addr.city}</p>
                </div>
              </div>
              <button onClick={() => removeAddress(addr.id)}
                className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          {!showAddrForm ? (
            <button onClick={() => setShowAddrForm(true)}
              className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-purple-200 dark:border-[#2d2a45] rounded-2xl text-purple-500 dark:text-purple-400 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-[#1e1a35] transition-colors text-sm font-semibold">
              <Plus size={16} />
              {t("account_addAddress")}
            </button>
          ) : (
            <form onSubmit={handleAddAddress} className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-100 dark:border-[#2d2a45] shadow-sm p-5 space-y-3">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{t("account_newAddress")}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t("account_addressLabel")}</label>
                  <input value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                    className={inputClass} placeholder={t("account_addressLabelPh")} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>{t("account_street")}</label>
                  <input required value={addrForm.street} onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                    className={inputClass} placeholder={t("account_streetPh")} />
                </div>
                <div>
                  <label className={labelClass}>{t("account_city")}</label>
                  <input required value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    className={inputClass} placeholder={t("account_cityPh")} />
                </div>
                <div>
                  <label className={labelClass}>{t("account_zip")}</label>
                  <input required value={addrForm.zip} onChange={(e) => setAddrForm({ ...addrForm, zip: e.target.value })}
                    className={inputClass} placeholder={t("account_zipPh")} />
                </div>
              </div>
              {addrError && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm px-3 py-2.5 rounded-xl">
                  <AlertCircle size={14} />
                  {addrError}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setShowAddrForm(false); setAddrError(""); }}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-[#2d2a45] text-gray-500 dark:text-gray-400 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-[#14121f] transition-colors">
                  {t("account_cancel")}
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200 dark:shadow-purple-900/40">
                  {t("account_saveAddress")}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab: Obľúbené */}
      {tab === "oblubene" && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-50">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {t("account_refresh")}
            </button>
          </div>
          {favLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            </div>
          ) : favProducts.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-12 text-center">
              <Heart size={40} className="mx-auto text-purple-200 mb-3" />
              <p className="text-gray-400 font-medium">{t("account_noFavorites")}</p>
              <Link href="/" className="mt-4 inline-block text-sm text-purple-600 hover:underline font-medium">
                {t("account_browseProducts")}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favProducts.map((p) => {
                const discounted = p.discount ? p.price * (1 - p.discount / 100) : null;
                return (
                  <div key={p.id} className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm overflow-hidden flex">
                    <Link href={`/products/${p.id}`} className="relative w-28 shrink-0 bg-purple-50 dark:bg-[#14121f]">
                      <Image src={p.image} alt={p.name} fill className="object-cover" sizes="112px" />
                      {p.discount && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                          -{p.discount}%
                        </span>
                      )}
                    </Link>
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <Link href={`/products/${p.id}`}>
                          <p className="font-bold text-gray-900 dark:text-white hover:text-purple-600 transition-colors text-sm line-clamp-2">
                            {p.name}
                          </p>
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">{tCat(p.category)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        {discounted ? (
                          <div>
                            <span className="text-xs text-gray-400 line-through mr-1">{p.price.toFixed(2)} €</span>
                            <span className="font-extrabold gradient-text text-sm">{discounted.toFixed(2)} €</span>
                          </div>
                        ) : (
                          <span className="font-extrabold gradient-text text-sm">{p.price.toFixed(2)} €</span>
                        )}
                        <button
                          onClick={() => handleRemoveFav(p.id)}
                          className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title={t("products_removeFromFavorites")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Order Detail — full-screen slide-up on mobile, centered modal on desktop */}
      {detailOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 sm:flex sm:items-center sm:justify-center sm:p-4" onClick={() => setDetailOrder(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 sm:relative sm:inset-auto bg-white dark:bg-[#1a1826] rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-none"
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            </div>

            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-[#2d2a45]">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">{detailOrder.id}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{detailOrder.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[detailOrder.status] ?? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                  {statusLabel(detailOrder.status)}
                </span>
                <button onClick={() => setDetailOrder(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t("account_items")}</p>
                <div className="space-y-2">
                  {detailOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 dark:bg-[#14121f] rounded-xl px-4 py-2.5">
                      <span className="text-gray-700 dark:text-gray-300">{item.name} × {item.quantity}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{(item.price * item.quantity).toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-gray-100 dark:border-[#2d2a45] font-bold text-gray-900 dark:text-white text-sm">
                  <span>{t("account_total")}</span>
                  <span className="gradient-text">{detailOrder.total.toFixed(2)} €</span>
                </div>
              </div>

              {user.addresses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t("account_deliveryAddress")}</p>
                  <div className="bg-gray-50 dark:bg-[#14121f] rounded-xl px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-semibold text-gray-800 dark:text-gray-200">{user.addresses[0].label}</p>
                    <p>{user.addresses[0].street}</p>
                    <p>{user.addresses[0].zip} {user.addresses[0].city}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => setDetailOrder(null)}
                className="w-full py-3 gradient-btn text-white rounded-xl font-bold text-sm shadow-md shadow-purple-200 dark:shadow-purple-900/40"
              >
                {t("account_close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
