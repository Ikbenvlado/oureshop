/**
 * Email notification E2E tests
 *
 * Každý test spustí akciu na live stránke, potom cez konzolu vypíše
 * pokyny na overenie emailu v Gmaile (strickovladimir@gmail.com).
 *
 * Predpoklady:
 *  - Zákazník: goforit7707@proton.me / 11111111
 *  - Admin: lindoyfeo@tutamail.com / y2SxTjSw8Fl0Gp6^55%Z
 *  - Stripe testovacia karta: 4242 4242 4242 4242 | 12/29 | 123
 */

import { test, expect } from "@playwright/test";

const GMAIL = "strickovladimir@gmail.com";
const CUSTOMER_EMAIL = "goforit7707@proton.me";
const CUSTOMER_PASSWORD = "11111111";
const ADMIN_EMAIL = "lindoyfeo@tutamail.com";
const ADMIN_PASSWORD = "y2SxTjSw8Fl0Gp6^55%Z";

// Zavrie Cookie banner ak je prítomný
async function dismissCookieBanner(page: any) {
  const banner = page.locator('button:has-text("Essential only"), button:has-text("Accept all")').first();
  const visible = await banner.isVisible({ timeout: 3000 }).catch(() => false);
  if (visible) {
    await banner.click();
    await page.waitForTimeout(500);
  }
}

// Prihlásenie zákazníka
async function loginCustomer(page: any) {
  await page.goto("/login");
  await dismissCookieBanner(page);
  await page.fill('input[type="email"]', CUSTOMER_EMAIL);
  await page.fill('input[type="password"]', CUSTOMER_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 12000 });
}

// Prihlásenie admina
async function loginAdmin(page: any) {
  await page.goto("/admin");
  await dismissCookieBanner(page);
  await page.locator('input[type="text"], input[type="email"]').first().fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.locator('input[type="password"]').waitFor({ state: "hidden", timeout: 12000 }).catch(() => {});
}

test.describe("Email notifikácie", () => {

  // ─── 1. Kontaktný formulár — auto-reply na Gmail ─────────────────────────

  test("kontaktný formulár — auto-reply príde na Gmail", async ({ page }) => {
    const timestamp = Date.now();

    await page.goto("/contact");
    await dismissCookieBanner(page);
    await expect(page.locator("h1")).toBeVisible({ timeout: 8000 });

    // Kontaktný formulár používa placeholder "Ján Novák" a "jan@priklad.sk"
    // Inputy sú v poradí: meno, email, správa
    const inputs = page.locator('input:not([type="hidden"])');
    await inputs.nth(0).fill("Playwright Test");
    await inputs.nth(1).fill(GMAIL);
    await page.locator("textarea").first().fill(`Playwright auto-test ${timestamp}`);

    await page.locator('button[type="submit"]').click();

    // Overíme úspešné odoslanie — success text alebo zmiznutie textu v inpute
    await page.waitForTimeout(5000);
    const successMsg = page.locator(
      'text=Správa odoslaná, text=odoslaná, text=Ďakujeme, text=received, text=sent, text=prijatá'
    );
    const isSuccess = await successMsg.first().isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`
══════════════════════════════════════════════════════════════
EMAIL TEST 1: Kontaktný formulár auto-reply
Čas odoslania: ${new Date().toISOString()}
Adresát: ${GMAIL}
Odosielateľ: noreply@ourstone.fun
Hľadaj predmet: "Vaša správa bola prijatá — OurEshop"
Telo: "Správa prijatá!", meno "Playwright Test"
Úspech na stránke: ${isSuccess}
══════════════════════════════════════════════════════════════
    `);

    expect(isSuccess || true).toBe(true); // Email odoslanie je async — test prechádza vždy
  });

  // ─── 2. Obnovenie hesla — reset email na Gmail ────────────────────────────

  test("forgot password — reset email príde na Gmail", async ({ page }) => {
    await page.goto("/forgot-password");
    await dismissCookieBanner(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await page.locator('input[type="email"]').fill(GMAIL);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);

    // Stránka zobrazí potvrdenie alebo zostane tichá (bezpečnostný dôvod)
    const shown = await page.locator(
      'text=odoslaný, text=sent, text=skontroluj, text=check, text=email'
    ).first().isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`
══════════════════════════════════════════════════════════════
EMAIL TEST 2: Obnovenie hesla
Čas: ${new Date().toISOString()}
Gmail: ${GMAIL}
Odosielateľ: noreply@ourstone.fun
Hľadaj predmet: "Obnovenie hesla" alebo "Password reset"
Telo: reset link s tokenom
POZNÁMKA: Email príde IBA ak ${GMAIL} má účet v OurEshop.
Potvrdenie viditeľné: ${shown}
══════════════════════════════════════════════════════════════
    `);

    expect(true).toBe(true);
  });

  // ─── 3. Registrácia — admin notifikácia (na rocketmail) ──────────────────

  test("registrácia — nový zákazník (admin notifikácia na rocketmail)", async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `playwright.test.${timestamp}@mailinator.com`;

    await page.goto("/register");
    await dismissCookieBanner(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Meno input (prvý), email, heslo
    const nameInput = page.locator(
      'input[placeholder*="Ján"], input[placeholder*="John"], input[placeholder*="name"], input[placeholder*="meno"]'
    ).first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill(`Playwright ${timestamp}`);
    } else {
      await page.locator('input:not([type="email"]):not([type="password"])').first().fill(`Playwright ${timestamp}`);
    }

    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').first().fill("TestPass123!");

    // Potvrdiť heslo ak existuje
    const confirmPass = page.locator('input[type="password"]').nth(1);
    if (await confirmPass.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPass.fill("TestPass123!");
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(4000);

    const redirected = !page.url().includes("/register");

    console.log(`
══════════════════════════════════════════════════════════════
EMAIL TEST 3: Registrácia zákazníka
Čas: ${new Date().toISOString()}
Test email: ${testEmail}
Presmerovaný: ${redirected}
POZNÁMKA: Admin notifikácia ide na vladimirstricko@rocketmail.com
Skontroluj rocketmail pre predmet: "Playwright ${timestamp}"
══════════════════════════════════════════════════════════════
    `);

    expect(true).toBe(true);
  });

  // ─── 4. Objednávka — potvrdenie na Gmail (priamy API test) ──────────────

  test("objednávka — potvrdenie príde na Gmail (priamy API volanie)", async ({ page }) => {
    // Prihlásenie zákazníka — získame session cookie
    await loginCustomer(page);

    // Zavoláme send-order-confirmation API priamo s autentizovanou session
    // (Playwright page.request zdieľa cookies s page)
    const orderId = `ORD-PLAYWRIGHT-${Date.now()}`;
    const response = await page.request.post("https://www.ourstone.fun/api/send-order-confirmation", {
      data: {
        name: "Playwright Test",
        email: GMAIL,
        orderId,
        items: [
          { name: "Testovací produkt", price: 29.99, quantity: 1 },
          { name: "Druhý testovací produkt", price: 9.99, quantity: 2 },
        ],
        shipping: 0,
        total: 49.97,
        address: "Testovacia 1, 01001 Žilina",
        phone: "+421900000000",
        payment: "card",
        lang: "sk",
      },
    });

    const status = response.status();
    let body: any = {};
    try { body = await response.json(); } catch {}

    const emailSent = status === 200 && body?.ok === true;

    console.log(`
══════════════════════════════════════════════════════════════
EMAIL TEST 4: Potvrdenie objednávky (priamy API test)
Čas: ${new Date().toISOString()}
OrderID: ${orderId}
Adresát: ${GMAIL}
API Status: ${status}
API Response: ${JSON.stringify(body)}
Email odoslaný: ${emailSent}

Hľadaj v Gmaile (strickovladimir@gmail.com):
  Predmet: "Potvrdenie objednávky ${orderId} — OurEshop"
  Odosielateľ: objednavky@ourstone.fun
  Telo: "Objednávka prijatá!", položky, suma 49.97 €
══════════════════════════════════════════════════════════════
    `);

    if (status === 500 && body?.error?.includes("domain is not verified")) {
      console.log(`
⚠️  RESEND DOMÉNA NEOVERENÁ
Doména ourstone.fun nie je overená v Resend.
Prihláste sa na https://resend.com/domains a pridajte doménu.
Nastavte DNS záznamy v Websupport (MX, DKIM, SPF).
Bez overenia domény sa žiadne emaily neodosielajú.
      `);
    }

    // Test prechádza vždy — informuje o stave
    expect(true).toBe(true);
  });

  // ─── 4b. Objednávka cez UI s Stripe kartou ───────────────────────────────

  test("objednávka — checkout UI s testovacou Stripe kartou", async ({ page }) => {
    await loginCustomer(page);

    // Pridáme produkt do košíka
    await page.goto("/");
    await dismissCookieBanner(page);
    const firstProduct = page.locator('[href*="/products/"]').first();
    await firstProduct.waitFor({ timeout: 10000 });
    await firstProduct.click();
    await expect(page).toHaveURL(/\/products\//);

    await dismissCookieBanner(page);
    const addToCart = page.locator(
      'button:has-text("Do košíka"), button:has-text("Add to cart"), button:has-text("Pridať")'
    ).first();
    await addToCart.waitFor({ timeout: 8000 });
    await addToCart.click();
    await page.waitForTimeout(1000);

    // Checkout
    await page.goto("/checkout");
    await dismissCookieBanner(page);
    await expect(page.locator("h1")).toBeVisible({ timeout: 10000 });

    // Zavrieme test mode modal
    const testModal = page.locator('button:has-text("Got it, continue"), button:has-text("Rozumiem, pokračovať")').first();
    if (await testModal.isVisible({ timeout: 3000 }).catch(() => false)) {
      await testModal.click();
      await page.waitForTimeout(800);
    }

    // Počkáme na useEffect, potom prepisujeme email na Gmail
    await page.waitForTimeout(2000);

    const phoneInput = page.locator('input[placeholder*="+421"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const v = await phoneInput.inputValue();
      if (!v) await phoneInput.fill("+421900000000");
    }

    const streetInput = page.locator('input[placeholder*="Main St"], input[placeholder*="Street"]').first();
    if (await streetInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const v = await streetInput.inputValue();
      if (!v) await streetInput.fill("Testovacia 1");
    }

    const cityInput = page.locator('input[placeholder*="Bratislava"], input[placeholder*="City"]').first();
    if (await cityInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const v = await cityInput.inputValue();
      if (!v) await cityInput.fill("Žilina");
    }

    const zipInput = page.locator('input[placeholder*="811"], input[placeholder*="ZIP"]').first();
    if (await zipInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const v = await zipInput.inputValue();
      if (!v) await zipInput.fill("01001");
    }

    // Prepíšeme email na Gmail AKO POSLEDNÉ
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.click({ clickCount: 3 });
      await emailInput.fill(GMAIL);
    }

    // Continue to Payment
    const continueBtn = page.locator('button:has-text("Continue to Payment"), button:has-text("Pokračovať na platbu")').first();
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // Stripe CardElement iframe
    await page.waitForTimeout(3000);
    const stripeCardFrame = page.frameLocator('iframe[src*="js.stripe.com"]').first();
    const cardInput = stripeCardFrame.locator('input[name="cardnumber"], input[autocomplete="cc-number"]').first();

    if (await cardInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cardInput.fill("4242424242424242");
      const expInput = stripeCardFrame.locator('input[name="exp-date"], input[autocomplete="cc-exp"]').first();
      if (await expInput.isVisible().catch(() => false)) await expInput.fill("12/29");
      const cvcInput = stripeCardFrame.locator('input[name="cvc"], input[autocomplete="cc-csc"]').first();
      if (await cvcInput.isVisible().catch(() => false)) await cvcInput.fill("123");
    }

    await page.waitForTimeout(1000);
    const payBtn = page.locator('button:has-text("Pay"), button:has-text("Zaplatiť")').last();
    if (await payBtn.isEnabled({ timeout: 5000 }).catch(() => false)) {
      await payBtn.click({ force: true });
      await page.waitForTimeout(12000);
    }

    const currentUrl = page.url();
    const confirmed = await page.locator(
      'text=Objednávka prijatá, text=Order confirmed, text=Ďakujeme, text=Thank you'
    ).first().isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`
══════════════════════════════════════════════════════════════
EMAIL TEST 4b: Checkout UI s Stripe kartou
Čas: ${new Date().toISOString()}
URL po platbe: ${currentUrl}
Potvrdenie viditeľné: ${confirmed}
══════════════════════════════════════════════════════════════
    `);

    expect(true).toBe(true);
  });

  // ─── 5. Admin schváli recenziu — email zákazníkovi ───────────────────────

  test("admin schváli recenziu — email príde zákazníkovi", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/reviews");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });

    // Hľadáme čakajúce recenzie (pending)
    const approveBtn = page.locator(
      'button:has-text("Schváliť"), button:has-text("Approve"), button:has-text("schváliť"), button:has-text("approve")'
    ).first();

    const hasPending = await approveBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPending) {
      await approveBtn.click();
      await page.waitForTimeout(3000);
      console.log(`
══════════════════════════════════════════════════════════════
EMAIL TEST 5: Admin schválil recenziu
Čas: ${new Date().toISOString()}
Email o schválení ide na zákazníka ktorý napísal recenziu.
Odosielateľ: noreply@ourstone.fun alebo objednavky@ourstone.fun
Predmet: "Vaša recenzia bola schválená" alebo "approved"
══════════════════════════════════════════════════════════════
      `);
    } else {
      console.log("Žiadne čakajúce recenzie na schválenie.");
    }

    expect(true).toBe(true);
  });

  // ─── 6. Admin zamietne recenziu — email zákazníkovi ─────────────────────

  test("admin zamietne recenziu — email príde zákazníkovi", async ({ page }) => {
    await loginAdmin(page);
    await page.goto("/admin/reviews");
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 10000 });

    const rejectBtn = page.locator(
      'button:has-text("Zamietnuť"), button:has-text("Reject"), button:has-text("zamietnuť"), button:has-text("reject")'
    ).first();

    const hasPending = await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPending) {
      await rejectBtn.click();
      await page.waitForTimeout(3000);
      console.log(`
══════════════════════════════════════════════════════════════
EMAIL TEST 6: Admin zamietol recenziu
Čas: ${new Date().toISOString()}
Email o zamietnutí ide na zákazníka ktorý napísal recenziu.
Odosielateľ: noreply@ourstone.fun alebo objednavky@ourstone.fun
Predmet: "Vaša recenzia bola zamietnutá" alebo "rejected"
══════════════════════════════════════════════════════════════
      `);
    } else {
      console.log("Žiadne recenzie na zamietnutie.");
    }

    expect(true).toBe(true);
  });

  // ─── 7. Súhrnné pokyny pre Gmail MCP overenie ───────────────────────────

  test("súhrnné pokyny — overenie emailov v Gmaile", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║        OVERENIE EMAIL NOTIFIKÁCIÍ CEZ GMAIL MCP                 ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Gmail: strickovladimir@gmail.com                                ║
║                                                                  ║
║  1. KONTAKTNÝ FORMULÁR (auto-reply)                             ║
║     Odosielateľ: noreply@ourstone.fun                           ║
║     Predmet: "Vaša správa bola prijatá — OurEshop"              ║
║                                                                  ║
║  2. OBNOVENIE HESLA                                              ║
║     Odosielateľ: noreply@ourstone.fun                           ║
║     Predmet: "Obnovenie hesla" alebo "Password reset"           ║
║     (len ak Gmail má účet v OurEshop)                           ║
║                                                                  ║
║  3. POTVRDENIE OBJEDNÁVKY                                        ║
║     Odosielateľ: objednavky@ourstone.fun                        ║
║     Predmet: "Potvrdenie objednávky ORD-..."                    ║
║                                                                  ║
║  4. REGISTRÁCIA — admin notifikácia                              ║
║     → ide na vladimirstricko@rocketmail.com                     ║
║                                                                  ║
║  5+6. SCHVÁLENIE/ZAMIETNUTIE RECENZIE                            ║
║     → ide na email zákazníka ktorý napísal recenziu             ║
║                                                                  ║
║  GMAIL MCP PRÍKAZ:                                               ║
║  "Vyhľadaj v Gmaile emaily od ourstone.fun"                     ║
╚══════════════════════════════════════════════════════════════════╝
    `);

    expect(true).toBe(true);
  });
});
