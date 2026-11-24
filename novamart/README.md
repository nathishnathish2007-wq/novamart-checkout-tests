# NovaMart: demo shopping website with browser tests

A complete front-end shopping site (plain HTML, CSS and JavaScript) in a light-blue and warm-white theme, with a Playwright test suite.
No backend, database or real payments. Accounts, carts and orders are saved in the browser (localStorage).

## What is in the site
- **Landing page** with Sign in and Sign up.
- **Sign up:** name, mobile number, email, password, then a 6-digit verification code. Every field is validated.
- **Sign in** with email or mobile number plus password. Clear messages for unknown account and wrong password.
- **Access control:** shop, cart, checkout, orders and profile need a signed-in user; otherwise you are sent to Sign in with a message.
- **Shop:** 24 products in 6 categories, with search (name, brand, category, description), category filter, max-price filter, sorting and a Clear button.
- **Add to cart:** asks "Add this item?" first. The same item cannot be added twice. Quantity is limited to stock.
- **Cart:** price, quantity, line totals and order total. Saved per user, so it is still there after closing the browser.
- **Checkout:** name is required. Card or cash on delivery. A confirm-payment prompt, a decline message for failed payments, and one order confirmation with a reference (`ORD-XXXXXXXX`).
- **Orders** history and **Profile** (edit name and address).
- Fixed price test fixtures: Coffee Mug ₹200 and Wireless Mouse ₹500 (2 mugs = ₹400).

## Important honesty notes
- This is a **demo**. Passwords are hashed and stored in your own browser only. That is not real security; a real shop needs a server.
- The verification code is shown on screen ("Demo mode"). No SMS is sent.
- Payments are simulated. Test cards: `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined.
- Brands, products, ratings and review data are fictional sample data.
- **Product photos:** none are bundled. Put your own photos in `images/` (see `images/README.md`). Until then each card shows an icon tile.

## Run the website
Option A (easiest): double-click `index.html`.
Option B (local server): `node server.js`, then open http://localhost:4173

## Run the automated browser tests
Needs Node.js 18 or newer.
```bash
npm install
npx playwright install chromium     # one-time download
npm test                            # runs all 18 tests
npm run test:headed                 # watch the browser while tests run
npx playwright test -g "Test 1"     # run a single test
```
The test config starts `server.js` by itself. Each test uses a fresh browser context, so storage always starts empty.

## Manual exploratory run with screenshots
```bash
npm run explore
```
Writes screenshots and `evidence/explore-output.txt`.

## Files
| File | Purpose |
|---|---|
| `index.html` | The whole website |
| `server.js` | Tiny static server used by the tests |
| `tests/novamart.spec.js` | 18 Playwright tests |
| `evidence/` | Screenshots, test output, exploratory run |
| `TEST_PLAN.md` | Risks, manual tests, results, defects |
| `images/` | Place for product photos |
