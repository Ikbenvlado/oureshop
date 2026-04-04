"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, ArrowLeft, CreditCard, Shield, Lock, RotateCcw, Tag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useUserAuth } from "@/context/UserAuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ---- Inner form that uses Stripe hooks (must be inside <Elements>) ----
function StripeCheckoutForm({
  form,
  total,
  shipping,
  items,
  lang,
  clientSecret,
  couponId,
  onSuccess,
}: {
  form: any;
  total: number;
  shipping: number;
  items: any[];
  lang: string;
  clientSecret: string;
  couponId?: string;
  onSuccess: (orderId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { user, addOrder } = useUserAuth();
  const { t } = useLanguage();
  const [submitting, setSubmitting] = useState(false);
  const [stripeError, setStripeError] = useState("");

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setStripeError("");

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) { setSubmitting(false); return; }

    const { error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });

    if (error) {
      setStripeError(error.message ?? "Platba zlyhala.");
      setSubmitting(false);
      return;
    }

    // Payment succeeded — create order
    const orderId = `ORD-${Date.now()}`;
    let confirmedId = orderId;

    const orderPayload = {
      orderId,
      date: new Date().toISOString().split("T")[0],
      total,
      status: "nová",
      items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
      customerName: form.name,
      customerEmail: form.email,
      address: `${form.address}, ${form.zip} ${form.city}`,
      couponId: couponId ?? null,
    };

    if (user) {
      const id = await addOrder(
        { date: orderPayload.date, total, status: "nová", items: orderPayload.items },
        { customerName: form.name, customerEmail: form.email, address: orderPayload.address },
        couponId
      );
      confirmedId = id;
    } else {
      // Guest — save order without user link
      await fetch("/api/user/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
    }

    const stockItems = items.filter((item: any) => item.stock != null);
    if (stockItems.length > 0) {
      await fetch("/api/checkout/decrement-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: stockItems.map((item: any) => ({ id: item.id, quantity: item.quantity })) }),
      });
    }

    fetch("/api/send-order-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        orderId: confirmedId,
        items: items.map((i: any) => ({ name: i.name, price: i.price, quantity: i.quantity })),
        shipping,
        total,
        address: `${form.address}, ${form.zip} ${form.city}`,
        phone: form.phone,
        payment: "card",
        lang,
      }),
    }).catch(() => {});

    onSuccess(confirmedId);
  };

  return (
    <form onSubmit={handlePay} className="space-y-4">
      <div className="px-4 py-3.5 border border-gray-200 dark:border-[#2d2a45] rounded-xl bg-white dark:bg-[#14121f]">
        <CardElement options={{
          style: {
            base: {
              fontSize: "15px",
              color: "#374151",
              fontFamily: "inherit",
              "::placeholder": { color: "#9ca3af" },
            },
            invalid: { color: "#ef4444" },
          },
          hidePostalCode: true,
        }} />
      </div>
      {stripeError && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-2.5">
          {stripeError}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="w-full py-4 gradient-btn text-white rounded-2xl font-bold text-base shadow-lg shadow-purple-200 disabled:opacity-60"
      >
        {submitting ? t("checkout_submitting") : `${t("checkout_pay")} — ${total.toFixed(2)} €`}
      </button>
    </form>
  );
}

// ---- Main checkout page ----
export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user, addOrder } = useUserAuth();
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [confirmedItems, setConfirmedItems] = useState<typeof items>([]);
  const [confirmedShipping, setConfirmedShipping] = useState(0);
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [countdown, setCountdown] = useState(20);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!submitted) return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current!);
  }, [submitted, router]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });
  const [clientSecret, setClientSecret] = useState("");
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [formStep, setFormStep] = useState<"details" | "payment">("details");
  const [showTestModal, setShowTestModal] = useState(true);

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: user.name,
      email: user.email,
      phone: user.phone || prev.phone,
      ...(user.addresses.length > 0
        ? { address: user.addresses[0].street, city: user.addresses[0].city, zip: user.addresses[0].zip }
        : {}),
    }));
  }, [user]);

  const shipping = totalPrice >= 50 ? 0 : 3.99;

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; type: string; value: number; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const discount = appliedCoupon?.discount ?? 0;
  const shippingAfterDiscount = appliedCoupon?.type === "shipping" ? Math.max(0, shipping - (appliedCoupon?.value ?? 0)) : shipping;
  const total = Math.max(0, totalPrice + shippingAfterDiscount - (appliedCoupon?.type !== "shipping" ? discount : 0));

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true); setCouponError("");
    const res = await fetch("/api/checkout/apply-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal: totalPrice }),
    });
    const data = await res.json();
    if (!res.ok) { setCouponError(data.error ?? "Neplatný kupón"); setApplyingCoupon(false); return; }
    setAppliedCoupon({ ...data.coupon, discount: data.discount });
    setApplyingCoupon(false);
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(""); setCouponError(""); };

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; zip?: string }>({});

  const phoneRegex = /^(\+421|0)[\s]?[0-9]{3}[\s]?[0-9]{3}[\s]?[0-9]{3}$/;
  const zipRegex = /^\d{3}\s?\d{2}$/;

  const validateForm = () => {
    const newErrors: { phone?: string; zip?: string } = {};
    if (!phoneRegex.test(form.phone)) newErrors.phone = t("checkout_phoneError");
    if (!zipRegex.test(form.zip)) newErrors.zip = t("checkout_zipError");
    return newErrors;
  };

  // For card payment: proceed to Stripe payment step
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    setErrors({});
    setCreatingIntent(true);
    const res = await fetch("/api/checkout/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(total * 100) }),
    });
    const data = await res.json();
    if (data.clientSecret) {
      setClientSecret(data.clientSecret);
      setFormStep("payment");
    }
    setCreatingIntent(false);
  };

  const handlePaymentSuccess = (id: string) => {
    setOrderId(id);
    setConfirmedItems([...items]);
    setConfirmedShipping(shipping);
    setConfirmedTotal(total);
    clearCart();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 mb-5">
            <CheckCircle size={44} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{t("checkout_orderReceived")}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t("checkout_thankYou")}, <strong>{form.name}</strong>!</p>
          {orderId && <p className="text-xs text-gray-400 mt-1 font-mono">{orderId}</p>}
        </div>

        <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-6 mb-4">
          <h2 className="text-sm font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">{t("checkout_summary")}</h2>
          <div className="space-y-2 mb-4">
            {confirmedItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{item.name} × {item.quantity}</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{(item.price * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 dark:border-[#2d2a45] pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>{t("checkout_shipping")}</span>
              <span>{confirmedShipping === 0 ? t("checkout_shippingFree") : `${confirmedShipping.toFixed(2)} €`}</span>
            </div>
            <div className="flex justify-between font-extrabold text-base">
              <span className="text-gray-900 dark:text-white">{t("checkout_total")}</span>
              <span className="gradient-text">{confirmedTotal.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-6 mb-8 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
          <p><span className="font-semibold text-gray-700 dark:text-gray-300">{t("checkout_emailField")}:</span> {form.email}</p>
          <p><span className="font-semibold text-gray-700 dark:text-gray-300">{t("checkout_phoneField")}:</span> {form.phone}</p>
          <p><span className="font-semibold text-gray-700 dark:text-gray-300">{t("checkout_address")}:</span> {form.address}, {form.zip} {form.city}</p>
          <p><span className="font-semibold text-gray-700 dark:text-gray-300">{t("checkout_payment")}:</span> {t("checkout_card")}</p>
          <p className="text-xs text-gray-400 pt-1">{t("checkout_delivery")}</p>
        </div>

        {/* Countdown redirect */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#e9d5ff" strokeWidth="4" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="#7c3aed" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - countdown / 20)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold gradient-text">
              {countdown}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {lang === "sk"
              ? `Presmerovanie na úvodnú stránku o ${countdown} s...`
              : `Redirecting to home page in ${countdown}s...`}
          </p>
          <Link href="/" className="text-sm text-purple-600 hover:underline font-semibold">
            {t("checkout_backToShop")}
          </Link>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t("checkout_cartEmpty")}</h1>
        <Link href="/" className="text-purple-600 hover:underline">{t("checkout_backToShop")}</Link>
      </main>
    );
  }

  const inputClass = "w-full px-4 py-3 border border-purple-100 dark:border-[#2d2a45] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-700 dark:text-gray-200 text-sm bg-white dark:bg-[#14121f] placeholder-gray-400 dark:placeholder-gray-600";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

  const detailsForm = (
    <>
      {/* Personal */}
      <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-6">
        <h2 className="text-base font-extrabold text-gray-800 dark:text-white mb-5">{t("checkout_personalInfo")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className={labelClass}>{t("checkout_name")}</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass} placeholder={t("checkout_namePh")} />
          </div>
          <div>
            <label className={labelClass}>{t("checkout_email")}</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass} placeholder={t("checkout_emailPh")} />
          </div>
          <div>
            <label className={labelClass}>{t("checkout_phone")}</label>
            <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`${inputClass} ${errors.phone ? "border-red-400 focus:ring-red-400" : ""}`} placeholder={t("checkout_phonePh")} />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-6">
        <h2 className="text-base font-extrabold text-gray-800 dark:text-white mb-5">{t("checkout_shippingAddr")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className={labelClass}>{t("checkout_street")}</label>
            <input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass} placeholder={t("checkout_streetPh")} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>{t("checkout_city")}</label>
            <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className={inputClass} placeholder={t("checkout_cityPh")} />
          </div>
          <div>
            <label className={labelClass}>{t("checkout_zip")}</label>
            <input required value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })}
              className={`${inputClass} ${errors.zip ? "border-red-400 focus:ring-red-400" : ""}`} placeholder={t("checkout_zipPh")} />
            {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/cart" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-600 mb-8 transition-colors">
        <ArrowLeft size={16} />
        {t("checkout_backToCart")}
      </Link>

      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-8">{t("checkout_title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Form */}
        <div className="lg:col-span-3 space-y-5">
          {formStep === "details" ? (
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              {detailsForm}

              {/* Coupon */}
              <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-5">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {lang === "sk" ? "Zľavový kupón" : "Discount coupon"}
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag size={15} className="text-green-600" />
                      <span className="font-mono font-bold text-green-700 dark:text-green-400">{appliedCoupon.code}</span>
                      <span className="text-green-600 font-semibold">
                        {appliedCoupon.type === "shipping" ? (lang === "sk" ? "— doprava zdarma" : "— free shipping") : `−${discount.toFixed(2)} €`}
                      </span>
                    </div>
                    <button type="button" onClick={removeCoupon} className="text-gray-400 hover:text-red-500 transition-colors"><X size={15} /></button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                        placeholder={lang === "sk" ? "Zadaj kód kupóna" : "Enter coupon code"}
                        className="flex-1 border border-gray-200 dark:border-[#2d2a45] rounded-xl px-4 py-2.5 text-sm font-mono uppercase text-gray-700 dark:text-gray-200 bg-white dark:bg-[#14121f] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                      />
                      <button type="button" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()}
                        className="px-4 py-2.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-semibold hover:bg-purple-200 disabled:opacity-50 transition-colors whitespace-nowrap">
                        {applyingCoupon ? "..." : lang === "sk" ? "Použiť" : "Apply"}
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                  </div>
                )}
              </div>

              <button type="submit" disabled={creatingIntent}
                className="w-full py-4 gradient-btn text-white rounded-2xl font-bold text-base shadow-lg shadow-purple-200 disabled:opacity-60">
                {creatingIntent
                  ? t("checkout_submitting")
                  : `${t("checkout_continueToPayment")} →`}
              </button>
              <div className="flex items-center justify-center gap-5 flex-wrap mt-1">
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><Shield size={13} className="text-green-500" /> {t("checkout_ssl")}</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><Lock size={13} className="text-green-500" /> {t("checkout_securePay")}</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><RotateCcw size={13} className="text-green-500" /> {t("checkout_returns")}</span>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Back button */}
              <button onClick={() => setFormStep("details")}
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-600 transition-colors">
                <ArrowLeft size={15} /> {t("checkout_backToDetails")}
              </button>

              {/* Stripe payment panel */}
              <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-50 dark:border-[#2d2a45] shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                  <Lock size={15} className="text-green-500" />
                  <h2 className="text-base font-extrabold text-gray-800 dark:text-white">{t("checkout_secureCard")}</h2>
                </div>
                {clientSecret && (
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <StripeCheckoutForm
                      form={form}
                      total={total}
                      shipping={shippingAfterDiscount}
                      items={items}
                      lang={lang}
                      clientSecret={clientSecret}
                      couponId={appliedCoupon?.id}
                      onSuccess={handlePaymentSuccess}
                    />
                  </Elements>
                )}
              </div>

              <div className="flex items-center justify-center gap-5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><Shield size={13} className="text-green-500" /> {t("checkout_ssl")}</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><Lock size={13} className="text-green-500" /> {t("checkout_securePay")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-2 h-fit sticky top-24">
          <div className="bg-white dark:bg-[#1a1826] rounded-2xl border border-purple-100 dark:border-[#2d2a45] shadow-sm p-6">
            <h2 className="text-base font-extrabold text-gray-800 dark:text-white mb-5">{t("checkout_orderSummary")}</h2>
            <div className="space-y-3 mb-5">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 truncate pr-2">{item.name} × {item.quantity}</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
            </div>
            <div className="border-t border-purple-50 dark:border-[#2d2a45] pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>{t("checkout_subtotal")}</span>
                <span>{totalPrice.toFixed(2)} €</span>
              </div>
              {appliedCoupon && appliedCoupon.type !== "shipping" && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span className="flex items-center gap-1"><Tag size={12} /> {appliedCoupon.code}</span>
                  <span>−{discount.toFixed(2)} €</span>
                </div>
              )}
              <div className="flex justify-between text-gray-400">
                <span>{t("checkout_shipping")}</span>
                <span className={shippingAfterDiscount === 0 ? "text-green-600 font-semibold" : ""}>
                  {shippingAfterDiscount === 0 ? t("checkout_shippingFree") : `${shippingAfterDiscount.toFixed(2)} €`}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-base pt-2 border-t border-purple-50 dark:border-[#2d2a45]">
                <span className="text-gray-900 dark:text-white">{t("checkout_total")}</span>
                <span className="gradient-text">{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-center text-gray-400 mt-3">{t("checkout_securePay")} · {t("checkout_ssl")}</p>
        </div>
      </div>

      {/* Test mode modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1a1826] rounded-3xl shadow-2xl w-full max-w-lg border border-amber-200 dark:border-amber-700/40 overflow-hidden">
            {/* Header */}
            <div className="bg-amber-50 dark:bg-amber-900/30 px-8 py-5 border-b border-amber-100 dark:border-amber-700/30 flex items-center gap-4">
              <span className="text-3xl">🧪</span>
              <div>
                <p className="font-extrabold text-amber-800 dark:text-amber-300 text-base">
                  {lang === "sk" ? "Testovací režim" : "Test Mode"}
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {lang === "sk"
                    ? "Platby sú spracované cez Stripe v testovacom režime — žiadne reálne peniaze"
                    : "Payments are processed via Stripe in test mode — no real money"}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-6 space-y-5">
              {/* Card info */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  {lang === "sk" ? "Testovacia karta" : "Test card"}
                </p>
                <div className="bg-gray-50 dark:bg-[#14121f] rounded-2xl p-5 space-y-3">
                  {(lang === "sk"
                    ? [
                        ["Číslo karty", "4242 4242 4242 4242"],
                        ["Dátum platnosti", "12/28 (ľubovoľný budúci)"],
                        ["CVV", "123 (ľubovoľné 3 čísla)"],
                      ]
                    : [
                        ["Card number", "4242 4242 4242 4242"],
                        ["Expiry date", "12/28 (any future date)"],
                        ["CVV", "123 (any 3 digits)"],
                      ]
                  ).map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{label}</span>
                      <span className="font-mono font-bold text-gray-800 dark:text-gray-200 text-base">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stripe note */}
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl px-5 py-3.5">
                <CreditCard size={18} className="text-blue-500 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {lang === "sk"
                    ? "Platby sú zabezpečené cez Stripe — líder v online platbách"
                    : "Payments secured by Stripe — the leader in online payments"}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 pb-7">
              <button
                onClick={() => setShowTestModal(false)}
                className="w-full py-3.5 gradient-btn text-white rounded-2xl font-bold text-base shadow-md shadow-purple-200"
              >
                {lang === "sk" ? "Rozumiem, pokračovať" : "Got it, continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
