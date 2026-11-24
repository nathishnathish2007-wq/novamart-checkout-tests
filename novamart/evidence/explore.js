// Manual-style exploratory run in a real browser. Saves screenshots + prints what happened.
// Run: npm run explore   (starts nothing; opens index.html directly)
const { chromium } = require('@playwright/test');
const path = require('path'), { pathToFileURL } = require('url');
const APP = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;
const shot = (p, n) => p.screenshot({ path: path.join(__dirname, n) });
(async () => {
  const b = await chromium.launch(), p = await (await b.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
  await p.goto(APP); await shot(p, '01-landing.png');
  await p.goto(APP + '#/signup');
  await p.fill('#n', 'Asha Kumar'); await p.fill('#ph', '9876543210'); await p.fill('#em', 'asha@example.com'); await p.fill('#pw', 'secret123');
  await p.getByTestId('send-code').click(); await shot(p, '02-verify-code.png');
  await p.fill('#cd', await p.getByTestId('demo-code').innerText()); await p.locator('#f-code button').click();
  await p.getByTestId('product-mug').waitFor(); await shot(p, '03-shop.png');
  // MANUAL TEST A: empty cart
  await p.goto(APP + '#/checkout'); await p.fill('#nm', 'Asha Kumar'); await p.fill('#cn', '4242424242424242');
  await p.getByTestId('place-order').click();
  console.log('A. EMPTY CART -> message:', await p.getByTestId('form-error').innerText());
  console.log('A. EMPTY CART -> confirmation shown:', await p.getByTestId('confirmation').count() > 0, '| name kept:', await p.locator('#nm').inputValue());
  await shot(p, '04-empty-cart-blocked.png');
  // MANUAL TEST B: rapid double click
  await p.goto(APP + '#/shop'); await p.getByTestId('add-mouse').click(); await p.getByTestId('modal-yes').click();
  await p.getByTestId('nav-cart').click(); await shot(p, '05-cart.png');
  await p.getByTestId('checkout-btn').click(); await p.fill('#cn', '4242424242424242');
  await p.getByTestId('place-order').click({ clickCount: 5, delay: 0 });
  console.log('B. DOUBLE CLICK -> confirm dialogs open:', await p.getByTestId('modal-yes').count());
  await p.getByTestId('modal-yes').click({ clickCount: 5, delay: 0 });
  await p.getByTestId('confirmation').waitFor(); await p.waitForTimeout(500);
  console.log('B. DOUBLE CLICK -> confirmations:', await p.getByTestId('confirmation').count(), '| reference:', await p.getByTestId('order-reference').innerText());
  await shot(p, '06-confirmation.png');
  await p.goto(APP + '#/orders');
  console.log('B. DOUBLE CLICK -> orders in history:', await p.locator('[data-testid^="order-ORD-"]').count());
  await b.close();
})();
