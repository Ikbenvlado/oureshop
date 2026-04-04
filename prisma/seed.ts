import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = [
    {
      sku: "ELEK-001",
      name: "Bezdrôtové slúchadlá Sony WH-1000XM5",
      nameEn: "Sony WH-1000XM5 Wireless Headphones",
      price: 349.99,
      image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&h=600&fit=crop",
      category: "Elektronika",
      description: "Prémiové bezdrôtové slúchadlá s aktívnym potlačením hluku, 30h výdrž batérie a kristálovo čistý zvuk.",
      descriptionEn: "Premium wireless headphones with active noise cancellation, 30h battery life and crystal-clear sound.",
      rating: 4.8,
      reviews: 245,
      inStock: true,
      discount: 10,
      stock: 25,
    },
    {
      sku: "ELEK-002",
      name: "Samsung Galaxy Tab S9 128GB",
      nameEn: "Samsung Galaxy Tab S9 128GB",
      price: 749.00,
      image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop",
      category: "Elektronika",
      description: "Výkonný tablet s 11-palcovým AMOLED displejom, S Pen v balení a IP68 odolnosťou voči vode.",
      descriptionEn: "Powerful tablet with an 11-inch AMOLED display, S Pen included and IP68 water resistance.",
      rating: 4.6,
      reviews: 132,
      inStock: true,
      discount: null,
      stock: 15,
    },
    {
      sku: "OBLE-001",
      name: "Pánska zimná bunda North Peak",
      nameEn: "North Peak Men's Winter Jacket",
      price: 129.90,
      image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop",
      category: "Oblečenie",
      description: "Teplá zimná bunda s kapucňou, vodeodolná a vetruodolná. Ideálna na hory aj do mesta.",
      descriptionEn: "Warm winter jacket with hood, waterproof and windproof. Perfect for mountains and city alike.",
      rating: 4.4,
      reviews: 89,
      inStock: true,
      discount: 25,
      stock: 40,
    },
    {
      sku: "OBLE-002",
      name: "Dámske bežecké tenisky AirFlow Pro",
      nameEn: "AirFlow Pro Women's Running Shoes",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop",
      category: "Oblečenie",
      description: "Ľahké a pohodlné bežecké tenisky s воздушnou podrážkou pre maximálny komfort pri behu.",
      descriptionEn: "Lightweight and comfortable running shoes with air cushion sole for maximum comfort during runs.",
      rating: 4.7,
      reviews: 203,
      inStock: true,
      discount: null,
      stock: 60,
    },
    {
      sku: "NABY-001",
      name: "Kancelárska stolička ErgoMax",
      nameEn: "ErgoMax Office Chair",
      price: 299.00,
      image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&h=600&fit=crop",
      category: "Nábytok",
      description: "Ergonomická kancelárska stolička s nastaviteľnou opierkou hlavy, bedrovú opierkou a sieťovým operadlom.",
      descriptionEn: "Ergonomic office chair with adjustable headrest, lumbar support and breathable mesh backrest.",
      rating: 4.5,
      reviews: 67,
      inStock: true,
      discount: 15,
      stock: 12,
    },
    {
      sku: "NABY-002",
      name: "Dubový jedálenský stôl Nordic 160cm",
      nameEn: "Nordic Oak Dining Table 160cm",
      price: 549.00,
      image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=600&fit=crop",
      category: "Nábytok",
      description: "Masívny dubový jedálenský stôl v škandinávskom štýle pre 6 osôb. Povrch ošetrený prírodným olejom.",
      descriptionEn: "Solid oak dining table in Scandinavian style, seats 6. Surface treated with natural oil.",
      rating: 4.9,
      reviews: 34,
      inStock: true,
      discount: null,
      stock: 5,
    },
    {
      sku: "KUCH-001",
      name: "Automatický kávovar DeLuxe 3000",
      nameEn: "DeLuxe 3000 Automatic Coffee Machine",
      price: 459.00,
      image: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&h=600&fit=crop",
      category: "Kuchyňa",
      description: "Plnoautomatický kávovar s mlynčekom, parnou tryskou a 15 prednastavenými receptami na kávu.",
      descriptionEn: "Fully automatic coffee machine with built-in grinder, steam wand and 15 preset coffee recipes.",
      rating: 4.7,
      reviews: 156,
      inStock: true,
      discount: 20,
      stock: 18,
    },
    {
      sku: "DOPL-001",
      name: "Kožený batoh Urban Classic",
      nameEn: "Urban Classic Leather Backpack",
      price: 79.90,
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop",
      category: "Doplnky",
      description: "Elegantný kožený batoh s priehradkou na notebook 15.6\", USB nabíjací port a vodoodpudivý povrch.",
      descriptionEn: "Elegant leather backpack with a 15.6\" laptop compartment, USB charging port and water-repellent surface.",
      rating: 4.3,
      reviews: 112,
      inStock: true,
      discount: null,
      stock: 35,
    },
    {
      sku: "SPOR-001",
      name: "Fitness náramok FitTrack Pro",
      nameEn: "FitTrack Pro Fitness Band",
      price: 59.99,
      image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=600&fit=crop",
      category: "Šport",
      description: "Vodotesný fitness náramok s meraním tepu, SpO2, spánku a 20+ športovými režimami. Výdrž 14 dní.",
      descriptionEn: "Waterproof fitness band with heart rate, SpO2 and sleep tracking, 20+ sport modes. 14-day battery life.",
      rating: 4.2,
      reviews: 298,
      inStock: true,
      discount: null,
      stock: 80,
    },
    {
      sku: "SPOR-002",
      name: "Yoga podložka Premium 6mm",
      nameEn: "Premium Yoga Mat 6mm",
      price: 34.90,
      image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop",
      category: "Šport",
      description: "Extra hrubá protišmyková yoga podložka z ekologického TPE materiálu. Rozmer 183x61cm.",
      descriptionEn: "Extra thick non-slip yoga mat made from eco-friendly TPE material. Size 183x61cm.",
      rating: 4.6,
      reviews: 74,
      inStock: true,
      discount: 10,
      stock: 50,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: p,
      create: p,
    });
  }

  console.log(`Seeded ${products.length} products.`);

  // Super admin account
  const adminEmail = "admin@shopsk.sk";
  const adminPassword = "admin123";
  const hash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: hash, role: "super_admin" },
    create: {
      email: adminEmail,
      passwordHash: hash,
      name: "Admin",
      role: "super_admin",
    },
  });

  console.log(`Super admin created: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
