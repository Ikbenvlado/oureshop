"use client";

import Link from "next/link";
import { RotateCcw, Package, Mail, Clock, CheckCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const content = {
  sk: {
    tag: "Spokojnosť zaručená",
    title: "Reklamácie a vrátenie",
    subtitle: "Nie ste spokojní? Nevadí — máte 30 dní na vrátenie tovaru a 24-mesačnú záručnú dobu. Vaša spokojnosť je pre nás prvoradá.",
    highlights: [
      { label: "Vrátenie tovaru", value: "30 dní" },
      { label: "Záručná doba", value: "24 mesiacov" },
      { label: "Vybavenie reklamácie", value: "do 30 dní" },
    ],
    stepsTitle: "Ako postupovať pri reklamácii",
    steps: [
      { icon: Mail, title: "1. Kontaktujte nás", text: "Napíšte nám na info@oureshop.fun alebo použite kontaktný formulár. Uveďte číslo objednávky a popis problému." },
      { icon: Package, title: "2. Zabaľte tovar", text: "Tovar starostlivo zabaľte do pôvodného alebo náhradného obalu. Priložte kópiu dokladu o kúpe a popis vady." },
      { icon: RotateCcw, title: "3. Odošlite späť", text: "Zašlite balík na adresu, ktorú vám poskytneme. Odporúčame zaslať tovar doporučene s poistením." },
      { icon: CheckCircle, title: "4. Vybavenie", text: "Po prijatí tovaru vás budeme informovať o postupe. Reklamáciu vybavíme do 30 dní od jej uplatnenia." },
    ],
    faqTitle: "Časté otázky",
    faqs: [
      { q: "Ako dlho trvá záručná doba?", a: "Záručná doba je 24 mesiacov od prevzatia tovaru. Pri spotrebnom materiáli môže byť záručná doba kratšia — vždy je uvedená v popise produktu." },
      { q: "Môžem vrátiť tovar bez udania dôvodu?", a: "Áno. Ako spotrebiteľ máte právo odstúpiť od zmluvy do 14 dní od prevzatia tovaru bez udania dôvodu. Tovar musí byť nepoužitý a v pôvodnom obale." },
      { q: "Kto hradí poštovné pri vrátení?", a: "Pri vrátení tovaru v rámci 14-dňovej lehoty hradí poštovné zákazník. Pri uznanej reklamácii (záručná oprava/výmena) hradíme dopravu my." },
      { q: "Do kedy dostanem peniaze späť?", a: "Vrátenú sumu vám pošleme do 14 dní od doručenia vráteného tovaru. Peniaze vrátime rovnakým spôsobom, akým ste platili." },
      { q: "Čo ak bol tovar poškodený pri doprave?", a: "V prípade viditeľného poškodenia obalu pri prevzatí tovar odmietnite alebo s doručovateľom spíšte záznam o škode. Kontaktujte nás do 24 hodín od prevzatia." },
      { q: "Na čo sa záruka nevzťahuje?", a: "Záruka sa nevzťahuje na poškodenie spôsobené nesprávnym použitím, mechanickým poškodením zákazníkom, živelnými pohromami alebo prirodzeným opotrebením." },
    ],
    helpTitle: "Potrebujete pomoc?",
    helpText: "Náš tím odpovedá na e-maily zvyčajne do 24 hodín v pracovných dňoch.",
    contactForm: "Kontaktný formulár",
  },
  en: {
    tag: "Satisfaction Guaranteed",
    title: "Returns & Complaints",
    subtitle: "Not satisfied? No problem — you have 30 days to return goods and a 24-month warranty. Your satisfaction is our top priority.",
    highlights: [
      { label: "Return period", value: "30 days" },
      { label: "Warranty period", value: "24 months" },
      { label: "Complaint resolution", value: "within 30 days" },
    ],
    stepsTitle: "How to file a complaint",
    steps: [
      { icon: Mail, title: "1. Contact us", text: "Write to us at info@oureshop.fun or use the contact form. Include your order number and a description of the issue." },
      { icon: Package, title: "2. Pack the goods", text: "Carefully pack the goods in the original or replacement packaging. Include a copy of the proof of purchase and a description of the defect." },
      { icon: RotateCcw, title: "3. Send it back", text: "Ship the parcel to the address we provide. We recommend sending goods by registered mail with insurance." },
      { icon: CheckCircle, title: "4. Resolution", text: "Once we receive the goods, we will keep you informed of the progress. We will resolve your complaint within 30 days of receipt." },
    ],
    faqTitle: "Frequently Asked Questions",
    faqs: [
      { q: "How long is the warranty period?", a: "The warranty period is 24 months from the date of receipt. For consumable items, the warranty may be shorter — always stated in the product description." },
      { q: "Can I return goods without stating a reason?", a: "Yes. As a consumer, you have the right to withdraw from the contract within 14 days of receiving the goods without stating a reason. Goods must be unused and in their original packaging." },
      { q: "Who pays for return shipping?", a: "For returns within the 14-day withdrawal period, the customer pays the return shipping. For accepted warranty claims (repair/replacement), we cover the shipping costs." },
      { q: "When will I get my money back?", a: "We will refund the amount within 14 days of receiving the returned goods, using the same payment method you used." },
      { q: "What if goods were damaged during delivery?", a: "If you notice visible damage to the packaging upon receipt, refuse the parcel or file a damage report with the courier. Contact us within 24 hours of receipt." },
      { q: "What is not covered by the warranty?", a: "The warranty does not cover damage caused by improper use, mechanical damage by the customer, natural disasters, or normal wear and tear." },
    ],
    helpTitle: "Need help?",
    helpText: "Our team usually replies to emails within 24 hours on business days.",
    contactForm: "Contact form",
  },
};

export default function ReturnsPage() {
  const { lang } = useLanguage();
  const c = content[lang];

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">
          {c.tag}
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
          {c.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed max-w-xl mx-auto">
          {c.subtitle}
        </p>
      </div>

      {/* Highlight strip */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {c.highlights.map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-50 dark:border-gray-700 shadow-sm p-4 text-center">
            <p className="text-xl font-extrabold gradient-text">{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Process steps */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-purple-50 dark:border-gray-700 shadow-sm p-8 mb-8">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">{c.stepsTitle}</h2>
        <div className="space-y-6">
          {c.steps.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-50 dark:bg-gray-700 shrink-0">
                <Icon size={18} className="text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-purple-50 dark:border-gray-700 shadow-sm p-8 mb-8">
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">{c.faqTitle}</h2>
        <div className="space-y-5">
          {c.faqs.map(({ q, a }) => (
            <div key={q} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-5 last:pb-0">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-2">{q}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-800 rounded-3xl border border-purple-100 dark:border-gray-700 p-8 text-center">
        <Clock size={28} className="text-purple-500 mx-auto mb-3" />
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 mb-2">{c.helpTitle}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          {c.helpText}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/contact"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200">
            {c.contactForm}
          </Link>
          <a href="mailto:info@oureshop.fun"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-700 border border-purple-100 dark:border-gray-600 text-purple-700 dark:text-purple-300 rounded-xl text-sm font-bold hover:bg-purple-50 transition-colors">
            info@oureshop.fun
          </a>
        </div>
      </div>
    </main>
  );
}
