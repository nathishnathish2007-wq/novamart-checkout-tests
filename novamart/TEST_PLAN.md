# Test Plan and Results: NovaMart

**Environment:** Chromium via Playwright 1.63.0, Linux, site served from `node server.js` (tests) and `file://` (exploratory). Date: 24 Nov 2026.

## Key risks, in priority order
| # | Risk | Covered by |
|---|---|---|
| 1 | Wrong total shown or charged | Test 3, Test 1 (confirmed total), stock-limit test |
| 2 | Order placed with empty cart or blank name | Test 2, empty-cart test |
| 3 | Duplicate order from repeated clicks | rapid double-click test, manual test B |
| 4 | Signed-out users reaching protected pages | access-control test |
| 5 | Wrong/unclear sign-up and sign-in messages | sign-up and sign-in tests |
| 6 | Payment failure still creating an order, or losing the cart | declined-payment and cancel tests |
| 7 | Cart lost after closing the browser | persistence test |
| 8 | Duplicate cart lines, quantity above stock | cart tests |
| 9 | Search/filter showing wrong products | catalogue tests |
| 10 | Broken layout on phones | phone-size test |

## The three required checks
| Required check | Test |
|---|---|
| Successful checkout gives a confirmation | **Test 1** (reference format `ORD-` + 8 characters, confirmed total ₹200) |
| Missing field blocks checkout | **Test 2** (message shown, no prompt, no confirmation, typed card number kept) |
| Quantity change updates the exact total | **Test 3** (2 mugs = ₹400, plus a mouse = ₹900) |

## Automated results
`npm test` gave **18 passed, 0 failed** (about 22 s). Full output: `evidence/test-results.txt`.

## Manual / exploratory checks
Run as a scripted real-browser session (`npm run explore`); a hand-clicked pass on a real phone is still recommended.

| Test | Expected | Actual | Result |
|---|---|---|---|
| A. Empty cart, name and card filled, click Place Order | Blocked, clear message, name kept | Message: "Your cart is empty. Add an item before placing an order." No confirmation. Name kept. | Pass (`evidence/04-empty-cart-blocked.png`) |
| B. Rapid repeated clicks on Place Order and on Confirm | One confirmation, one order | One confirm prompt, 1 confirmation, 1 order in history | Pass (`evidence/06-confirmation.png`) |

## Defects found while building (all fixed)
**D1. Sign-in button did nothing** *(found by automated test 4)*
- Steps: sign up, sign out, open Sign in, enter an unknown email and any password, click Sign in.
- Expected: "No account found" message. Actual: nothing happened, no message.
- Cause: the email input had `id="id"`; in browsers, `form.id` then returns that input instead of the form's id, so the form was not recognised.
- Fix: read the id with `getAttribute('id')` and rename the input to `ident`. Test passes now.

**D2. "Please sign in to continue" message disappeared** *(found by a smoke check)*
- Steps: sign out, then open `#/orders` directly.
- Expected: Sign in page shows the message. Actual: page redirected but the message was missing, because the page was drawn twice and the first draw used the message up.
- Fix: keep the message until the user leaves the Sign in page.

**D3. Page failed to load (JavaScript syntax error)** *(found by first run)*
- Cause: two missing closing brackets in the cart and orders views. Fixed.

**Cosmetic:** a 4.0 rating showed as "4". Fixed to one decimal.

No open defects were found in the final build.

## Known gaps
- No real product photos tested (none bundled); fallback tiles are tested visually only.
- Chromium only; Firefox, Safari and real phones not tested.
- Security is demo-level (browser storage). Double-submit protection is client-side only.
- Verification code is displayed on screen by design for the demo.
