"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const content = {
  sk: {
    tag: "GDPR",
    title: "Ochrana osobných údajov",
    subtitle: "Platné od 1. januára 2026 · V súlade s nariadením GDPR",
    question: "Máte otázky týkajúce sa ochrany osobných údajov?",
    contact: "Kontaktovať nás",
    sections: [
      {
        title: "1. Prevádzkovateľ",
        content: [
          "Prevádzkovateľom osobných údajov je ShopSK so sídlom na Slovensku, kontakt: info@oureshop.fun.",
          "Spracúvame osobné údaje v súlade s nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 (GDPR) a zákonom č. 18/2018 Z. z. o ochrane osobných údajov.",
        ],
      },
      {
        title: "2. Aké údaje zbierame",
        content: [
          "Identifikačné a kontaktné údaje: meno a priezvisko, e-mailová adresa, telefónne číslo, doručovacia adresa.",
          "Transakčné údaje: história objednávok, sumy platieb, zvolený spôsob platby.",
          "Technické údaje: IP adresa, typ prehliadača, navštívené stránky — zbierané anonymne za účelom analytiky.",
        ],
      },
      {
        title: "3. Účel a právny základ spracovania",
        content: [
          "Vybavenie objednávky a doručenie tovaru — plnenie zmluvy (čl. 6 ods. 1 písm. b) GDPR).",
          "Zasielanie potvrdení a informácií o stave objednávky — oprávnený záujem prevádzkovateľa.",
          "Zasielanie marketingových e-mailov — len so súhlasom zákazníka (čl. 6 ods. 1 písm. a) GDPR).",
          "Plnenie zákonných povinností (účtovníctvo, daňové doklady) — zákonná povinnosť (čl. 6 ods. 1 písm. c) GDPR).",
        ],
      },
      {
        title: "4. Doba uchovávania údajov",
        content: [
          "Osobné údaje súvisiace s objednávkami uchovávame po dobu 5 rokov z dôvodu zákonných účtovných a daňových povinností.",
          "Údaje registrovaných zákazníkov uchovávame po dobu trvania zákazníckeho účtu a 1 rok po jeho zrušení.",
          "Marketingový súhlas — do jeho odvolania.",
        ],
      },
      {
        title: "5. Príjemcovia osobných údajov",
        content: [
          "Prepravné spoločnosti — za účelom doručenia objednávky (meno, adresa, telefón).",
          "Platobné brány — za účelom spracovania platby (prevádzkovateľ nemá prístup k údajom o karte).",
          "Poskytovateľ e-mailových služieb Resend — za účelom zasielania potvrdzovacích e-mailov.",
          "Neon — cloudové úložisko databázy, prevádzkovateľ EÚ servera (AWS eu-central-1, Frankfurt).",
        ],
      },
      {
        title: "6. Vaše práva",
        content: [
          "Právo na prístup — môžete požiadať o kópiu vašich osobných údajov, ktoré spracúvame.",
          "Právo na opravu — môžete požiadať o opravu nesprávnych údajov.",
          "Právo na výmaz — môžete požiadať o vymazanie vašich údajov, ak neexistuje zákonný dôvod na ich ďalšie spracúvanie.",
          "Právo na prenosnosť — môžete požiadať o poskytnutie vašich údajov v štruktúrovanom formáte.",
          "Právo namietať — môžete namietať proti spracúvaniu na základe oprávneného záujmu.",
          "Právo odvolať súhlas — ak je spracúvanie založené na súhlase, môžete ho kedykoľvek odvolať.",
        ],
      },
      {
        title: "7. Sťažnosti",
        content: [
          "Ak sa domnievate, že vaše práva boli porušené, máte právo podať sťažnosť na Úrad na ochranu osobných údajov Slovenskej republiky (www.dataprotection.gov.sk).",
        ],
      },
      {
        title: "8. Súbory cookie",
        content: [
          "Náš web používa technické cookies nevyhnutné na fungovanie košíka a prihlásenia. Nepoužívame reklamné ani analytické cookies tretích strán bez vášho súhlasu.",
        ],
      },
    ],
  },
  en: {
    tag: "GDPR",
    title: "Privacy Policy",
    subtitle: "Effective from January 1, 2026 · Compliant with GDPR",
    question: "Have questions about our Privacy Policy?",
    contact: "Contact us",
    sections: [
      {
        title: "1. Data Controller",
        content: [
          "The data controller is ShopSK, based in Slovakia, contact: info@oureshop.fun.",
          "We process personal data in accordance with Regulation (EU) 2016/679 of the European Parliament and of the Council (GDPR) and Act No. 18/2018 Coll. on the Protection of Personal Data.",
        ],
      },
      {
        title: "2. Data We Collect",
        content: [
          "Identification and contact data: name, email address, phone number, delivery address.",
          "Transaction data: order history, payment amounts, chosen payment method.",
          "Technical data: IP address, browser type, pages visited — collected anonymously for analytics purposes.",
        ],
      },
      {
        title: "3. Purpose and Legal Basis for Processing",
        content: [
          "Order fulfilment and delivery — performance of a contract (Art. 6(1)(b) GDPR).",
          "Sending order confirmations and status updates — legitimate interest of the controller.",
          "Sending marketing emails — only with customer consent (Art. 6(1)(a) GDPR).",
          "Compliance with legal obligations (accounting, tax documents) — legal obligation (Art. 6(1)(c) GDPR).",
        ],
      },
      {
        title: "4. Data Retention",
        content: [
          "Personal data related to orders is retained for 5 years due to statutory accounting and tax obligations.",
          "Registered customer data is retained for the duration of the customer account and 1 year after its deletion.",
          "Marketing consent — until it is withdrawn.",
        ],
      },
      {
        title: "5. Data Recipients",
        content: [
          "Shipping companies — for the purpose of order delivery (name, address, phone number).",
          "Payment gateways — for payment processing (the controller has no access to card details).",
          "Email service provider Resend — for sending confirmation emails.",
          "Supabase — cloud database storage, EU server operator in Germany.",
        ],
      },
      {
        title: "6. Your Rights",
        content: [
          "Right of access — you may request a copy of your personal data that we process.",
          "Right to rectification — you may request correction of inaccurate data.",
          "Right to erasure — you may request deletion of your data if there is no legal basis for further processing.",
          "Right to data portability — you may request your data in a structured format.",
          "Right to object — you may object to processing based on legitimate interest.",
          "Right to withdraw consent — if processing is based on consent, you may withdraw it at any time.",
        ],
      },
      {
        title: "7. Complaints",
        content: [
          "If you believe your rights have been violated, you have the right to lodge a complaint with the Office for Personal Data Protection of the Slovak Republic (www.dataprotection.gov.sk).",
        ],
      },
      {
        title: "8. Cookies",
        content: [
          "Our website uses technical cookies necessary for the shopping cart and login functionality. We do not use third-party advertising or analytics cookies without your consent.",
        ],
      },
    ],
  },
};

export default function PrivacyPage() {
  const { lang } = useLanguage();
  const c = content[lang];

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <span className="inline-block text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">
          {c.tag}
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-4">
          {c.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {c.subtitle}
        </p>
      </div>

      <div className="space-y-6">
        {c.sections.map(({ title, content: paragraphs }) => (
          <div key={title} className="bg-white dark:bg-gray-800 rounded-2xl border border-purple-50 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-gray-100 mb-4">{title}</h2>
            <ul className="space-y-3">
              {paragraphs.map((para, i) => (
                <li key={i} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed flex gap-2">
                  <span className="text-purple-300 mt-0.5 shrink-0">–</span>
                  {para}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-purple-50 dark:bg-gray-800 rounded-2xl border border-purple-100 dark:border-gray-700 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {c.question}
        </p>
        <Link href="/contact"
          className="inline-flex items-center gap-2 px-5 py-2.5 gradient-btn text-white rounded-xl text-sm font-bold shadow-md shadow-purple-200">
          {c.contact}
        </Link>
      </div>
    </main>
  );
}
