"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const content = {
  sk: {
    tag: "Právne informácie",
    title: "Obchodné podmienky",
    subtitle: "Platné od 1. januára 2026",
    question: "Máte otázky k obchodným podmienkam?",
    contact: "Kontaktovať nás",
    sections: [
      {
        title: "1. Všeobecné ustanovenia",
        content: [
          "Tieto všeobecné obchodné podmienky (ďalej len 'podmienky') upravujú práva a povinnosti zmluvných strán vyplývajúce z kúpnej zmluvy uzatvorenej medzi predávajúcim ShopSK (ďalej len 'predávajúci') a kupujúcim (ďalej len 'zákazník') prostredníctvom internetového obchodu na adrese shopsk.sk.",
          "Zákazník odoslaním objednávky potvrdzuje, že sa oboznámil s týmito podmienkami a súhlasí s nimi.",
        ],
      },
      {
        title: "2. Objednávka a uzatvorenie zmluvy",
        content: [
          "Objednávku možno uskutočniť prostredníctvom internetového obchodu. Objednávka je návrh kúpnej zmluvy.",
          "Kúpna zmluva je uzatvorená momentom, keď predávajúci potvrdí objednávku e-mailom zaslaným na adresu zákazníka.",
          "Predávajúci si vyhradzuje právo odmietnuť objednávku v prípade vypredania zásob alebo pri zjavnej chybe v cene produktu.",
        ],
      },
      {
        title: "3. Ceny a platba",
        content: [
          "Všetky ceny sú uvedené v eurách (€) vrátane DPH. Predávajúci si vyhradzuje právo na zmenu cien.",
          "Zákazník môže platiť platobnou kartou, bankovým prevodom alebo dobierkou.",
          "Pri platbe bankovým prevodom je zákazník povinný uviesť číslo objednávky ako variabilný symbol. Tovar je odoslaný až po pripísaní platby na účet predávajúceho.",
        ],
      },
      {
        title: "4. Dodanie tovaru",
        content: [
          "Predávajúci sa zaväzuje doručiť tovar do 2–4 pracovných dní od potvrdenia objednávky.",
          "Doprava je zadarmo pri objednávke nad 50 €. Pri objednávkach do 50 € je poštovné 3,99 €.",
          "Predávajúci nenesie zodpovednosť za oneskorené doručenie spôsobené prepravnou spoločnosťou.",
        ],
      },
      {
        title: "5. Odstúpenie od zmluvy",
        content: [
          "Zákazník — spotrebiteľ — má právo odstúpiť od zmluvy bez udania dôvodu do 14 dní od prevzatia tovaru.",
          "Tovar musí byť vrátený nepoškodený, v pôvodnom obale. Náklady na vrátenie znáša zákazník.",
          "Predávajúci vráti zaplatenú sumu vrátane poštovného do 14 dní od prijatia vráteného tovaru.",
          "Právo na odstúpenie od zmluvy nevzniká pri tovare, ktorý bol upravený na mieru zákazníka alebo pri hygienickom tovare po rozbalení.",
        ],
      },
      {
        title: "6. Zodpovednosť za vady",
        content: [
          "Predávajúci zodpovedá za vady, ktoré má tovar pri prevzatí zákazníkom, a za vady, ktoré sa vyskytnú po prevzatí v záručnej dobe.",
          "Záručná doba je 24 mesiacov. Záručná doba sa predlžuje o čas, po ktorý bol tovar v záručnej oprave.",
          "Zákazník je povinný tovar prezrieť bezprostredne po jeho prevzatí a reklamovať zjavné vady bez zbytočného odkladu.",
        ],
      },
      {
        title: "7. Záverečné ustanovenia",
        content: [
          "Predávajúci si vyhradzuje právo na zmenu týchto podmienok. Nové podmienky nadobúdajú účinnosť dňom ich uverejnenia.",
          "Prípadné spory riešia príslušné slovenské súdy. Na mimosúdne riešenie spotrebiteľských sporov je príslušná Slovenská obchodná inšpekcia (www.soi.sk).",
          "Tieto podmienky sú platné od 1. januára 2026.",
        ],
      },
    ],
  },
  en: {
    tag: "Legal Information",
    title: "Terms & Conditions",
    subtitle: "Effective from January 1, 2026",
    question: "Have questions about our Terms & Conditions?",
    contact: "Contact us",
    sections: [
      {
        title: "1. General Provisions",
        content: [
          "These General Terms and Conditions ('Terms') govern the rights and obligations of the parties arising from a purchase contract concluded between ShopSK ('Seller') and the buyer ('Customer') through the online store at shopsk.sk.",
          "By submitting an order, the Customer confirms that they have read these Terms and agree to them.",
        ],
      },
      {
        title: "2. Order and Contract Formation",
        content: [
          "Orders may be placed through the online store. An order constitutes an offer to conclude a purchase contract.",
          "The purchase contract is formed when the Seller confirms the order by email sent to the Customer's address.",
          "The Seller reserves the right to reject an order in the event of stock depletion or an obvious pricing error.",
        ],
      },
      {
        title: "3. Prices and Payment",
        content: [
          "All prices are listed in euros (€) including VAT. The Seller reserves the right to change prices.",
          "The Customer may pay by credit/debit card, bank transfer, or cash on delivery.",
          "For bank transfer payments, the Customer must include the order number as the variable symbol. Goods are dispatched only after payment is credited to the Seller's account.",
        ],
      },
      {
        title: "4. Delivery",
        content: [
          "The Seller undertakes to deliver goods within 2–4 business days of order confirmation.",
          "Shipping is free for orders over €50. For orders under €50, shipping costs €3.99.",
          "The Seller is not responsible for delayed delivery caused by the shipping company.",
        ],
      },
      {
        title: "5. Right of Withdrawal",
        content: [
          "The Customer — as a consumer — has the right to withdraw from the contract without stating a reason within 14 days of receiving the goods.",
          "The goods must be returned undamaged in their original packaging. The Customer bears the return shipping costs.",
          "The Seller will refund the paid amount including original shipping within 14 days of receiving the returned goods.",
          "The right of withdrawal does not apply to goods customised for the Customer or to hygiene products once unsealed.",
        ],
      },
      {
        title: "6. Liability for Defects",
        content: [
          "The Seller is liable for defects present at the time of handover and for defects that occur within the warranty period.",
          "The warranty period is 24 months. The warranty period is extended by any time the goods spent under warranty repair.",
          "The Customer is obliged to inspect the goods immediately upon receipt and report any visible defects without undue delay.",
        ],
      },
      {
        title: "7. Final Provisions",
        content: [
          "The Seller reserves the right to amend these Terms. New Terms take effect on the date of their publication.",
          "Any disputes shall be resolved by the competent Slovak courts. For out-of-court consumer dispute resolution, the Slovak Trade Inspection (www.soi.sk) is competent.",
          "These Terms are valid from January 1, 2026.",
        ],
      },
    ],
  },
};

export default function TermsPage() {
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
