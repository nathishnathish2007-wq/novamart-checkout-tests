const { test, expect } = require('@playwright/test');

const USER = { name: 'Asha Kumar', phone: '9876543210', email: 'asha@example.com', pw: 'secret123' };

// Every test runs in a brand-new browser context, so storage (accounts, carts, orders) always starts empty.
async function signUp(page, u = USER) {
  await page.goto('/#/signup');
  await page.locator('#n').fill(u.name);
  await page.locator('#ph').fill(u.phone);
  await page.locator('#em').fill(u.email);
  await page.locator('#pw').fill(u.pw);
  await page.getByTestId('send-code').click();
  await page.locator('#cd').fill(await page.getByTestId('demo-code').innerText());
  await page.locator('#f-code button').click();
  await expect(page.getByTestId('product-mug')).toBeVisible();
}
async function addToCart(page, id) {
  await page.getByTestId('add-' + id).click();
  await page.getByTestId('modal-yes').click();
}
async function goCheckout(page) {
  await page.getByTestId('nav-cart').click();
  await page.getByTestId('checkout-btn').click();
}

test.describe('Access and accounts', () => {
  test('landing page offers sign in and sign up', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('hero-signup')).toBeVisible();
    await expect(page.getByTestId('hero-signin')).toBeVisible();
    await expect(page.getByTestId('product-mug')).toHaveCount(0);
  });

  test('signed-out visitors are blocked from the shop and cart', async ({ page }) => {
    await page.goto('/#/cart');
    await expect(page.getByTestId('flash')).toHaveText('Please sign in to continue.');
    await expect(page).toHaveURL(/#\/signin$/);
    await page.goto('/#/shop');
    await expect(page.getByTestId('product-mug')).toHaveCount(0);
  });

  test('sign up rejects an invalid mobile number and a wrong code', async ({ page }) => {
    await page.goto('/#/signup');
    await page.locator('#n').fill(USER.name);
    await page.locator('#ph').fill('12345');
    await page.locator('#em').fill(USER.email);
    await page.locator('#pw').fill(USER.pw);
    await page.getByTestId('send-code').click();
    await expect(page.getByTestId('form-error')).toContainText('10-digit');
    await expect(page.locator('#n')).toHaveValue(USER.name);            // typed data preserved
    await page.locator('#ph').fill(USER.phone);
    await page.getByTestId('send-code').click();
    await page.locator('#cd').fill('000000');
    await page.locator('#f-code button').click();
    await expect(page.getByTestId('form-error')).toContainText('Incorrect code');
  });

  test('sign in works with the right password and explains wrong ones', async ({ page }) => {
    await signUp(page);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.goto('/#/signin');
    await page.locator('#ident').fill('nobody@example.com'); await page.locator('#pw').fill('whatever1');
    await page.getByRole('button', { name: 'Sign in' }).last().click();
    await expect(page.getByTestId('form-error')).toContainText('No account found');
    await page.locator('#ident').fill(USER.email); await page.locator('#pw').fill('wrongpass1');
    await page.getByRole('button', { name: 'Sign in' }).last().click();
    await expect(page.getByTestId('form-error')).toContainText('Incorrect password');
    await page.locator('#pw').fill(USER.pw);
    await page.getByRole('button', { name: 'Sign in' }).last().click();
    await expect(page.getByTestId('product-mug')).toBeVisible();
  });
});

test.describe('Catalogue', () => {
  test.beforeEach(async ({ page }) => { await signUp(page); });

  test('search handles partial text, brands and no results', async ({ page }) => {
    await page.getByTestId('search').fill('mous');
    await expect(page.getByTestId('product-mouse')).toBeVisible();
    await expect(page.getByTestId('product-mug')).toHaveCount(0);
    await page.getByTestId('search').fill('ZENTRO');
    await expect(page.locator('[data-testid^="product-"]')).toHaveCount(3);
    await page.getByTestId('search').fill('zzzz');
    await expect(page.getByTestId('empty-results')).toBeVisible();
    await page.getByRole('button', { name: 'Clear' }).click();
    await expect(page.getByTestId('product-mug')).toBeVisible();
  });

  test('category and price filters work together', async ({ page }) => {
    await page.getByTestId('cat').selectOption('Fashion');
    await expect(page.getByTestId('product-tee')).toBeVisible();
    await expect(page.getByTestId('product-mug')).toHaveCount(0);
    await page.getByTestId('max').fill('400');
    await expect(page.locator('[data-testid^="product-"]')).toHaveCount(1);
    await expect(page.getByTestId('product-cap')).toBeVisible();
  });

  test('out-of-stock products cannot be added', async ({ page }) => {
    await expect(page.getByTestId('add-cable')).toBeDisabled();
    await expect(page.getByTestId('product-cable')).toContainText('Out of stock');
  });
});

test.describe('Cart', () => {
  test.beforeEach(async ({ page }) => { await signUp(page); });

  test('adding asks for confirmation, cancel adds nothing, duplicates are blocked', async ({ page }) => {
    await page.getByTestId('add-mug').click();
    await page.getByTestId('modal-no').click();
    await expect(page.getByTestId('cart-count')).toHaveText('0');
    await addToCart(page, 'mug');
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await page.getByTestId('add-mug').click();
    await expect(page.getByTestId('modal-yes')).toHaveCount(0);          // no second confirmation, no second line
    await expect(page.locator('#toast')).toContainText('already in your cart');
    await page.getByTestId('nav-cart').click();
    await expect(page.locator('[data-testid^="cart-row-"]')).toHaveCount(1);
  });

  test('cannot raise a quantity above the available stock', async ({ page }) => {
    await addToCart(page, 'notes');                                       // only 3 in stock
    await page.getByTestId('nav-cart').click();
    await page.locator('[data-act=inc]').click();
    await page.locator('[data-act=inc]').click();
    await expect(page.getByTestId('qty-notes')).toHaveText('3');
    await page.locator('[data-act=inc]').click();
    await expect(page.locator('#toast')).toContainText('Only 3 in stock');
    await expect(page.getByTestId('qty-notes')).toHaveText('3');
  });

  test('cart and login survive closing and reopening the browser', async ({ page, context, browser, baseURL }) => {
    await addToCart(page, 'mug');
    const saved = await context.storageState();
    const reopened = await browser.newContext({ baseURL, storageState: saved });
    const page2 = await reopened.newPage();
    await page2.goto('/#/cart');
    await expect(page2.getByTestId('qty-mug')).toHaveText('1');
    await expect(page2.getByTestId('order-total')).toHaveText('₹200');
    await reopened.close();
  });
});

test.describe('Checkout (the three required checks)', () => {
  test.beforeEach(async ({ page }) => { await signUp(page); });

  test('Test 1: successful checkout shows one confirmation with a reference', async ({ page }) => {
    await addToCart(page, 'mug');
    await goCheckout(page);
    await page.locator('#nm').fill('Asha Kumar');
    await page.locator('#cn').fill('4242 4242 4242 4242');
    await page.getByTestId('place-order').click();
    await page.getByTestId('modal-yes').click();
    await expect(page.getByTestId('confirmation')).toBeVisible();
    await expect(page.getByTestId('order-reference')).toHaveText(/^ORD-[A-Z0-9]{8}$/);
    await expect(page.getByTestId('confirmed-total')).toHaveText('₹200');
  });

  test('Test 2: a missing name blocks checkout and keeps what was entered', async ({ page }) => {
    await addToCart(page, 'mug');
    await goCheckout(page);
    await page.locator('#nm').fill('');
    await page.locator('#cn').fill('4242 4242 4242 4242');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('name-error')).toHaveText('Please enter your full name.');
    await expect(page.getByTestId('modal-yes')).toHaveCount(0);
    await expect(page.getByTestId('confirmation')).toHaveCount(0);
    await expect(page.locator('#cn')).toHaveValue('4242 4242 4242 4242');
    await expect(page.getByTestId('order-total')).toHaveText('₹200');
  });

  test('Test 3: changing quantity updates the exact total (2 mugs = ₹400)', async ({ page }) => {
    await addToCart(page, 'mug');
    await page.getByTestId('nav-cart').click();
    await page.locator('[data-act=inc]').click();
    await expect(page.getByTestId('qty-mug')).toHaveText('2');
    await expect(page.getByTestId('line-total-mug')).toHaveText('₹400');
    await expect(page.getByTestId('order-total')).toHaveText('₹400');
    await page.goBack();
    await addToCart(page, 'mouse');
    await page.getByTestId('nav-cart').click();
    await expect(page.getByTestId('order-total')).toHaveText('₹900');
  });

  test('empty cart blocks checkout', async ({ page }) => {
    await page.goto('/#/checkout');
    await page.locator('#nm').fill('Asha Kumar');
    await page.locator('#cn').fill('4242 4242 4242 4242');
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('form-error')).toContainText('cart is empty');
    await expect(page.getByTestId('confirmation')).toHaveCount(0);
  });

  test('declined payment shows a message, creates no order and keeps the cart', async ({ page }) => {
    await addToCart(page, 'mug');
    await goCheckout(page);
    await page.locator('#cn').fill('4000 0000 0000 0002');
    await page.getByTestId('place-order').click();
    await page.getByTestId('modal-yes').click();
    await expect(page.getByTestId('form-error')).toContainText('Payment declined');
    await expect(page.getByTestId('confirmation')).toHaveCount(0);
    await page.goto('/#/orders');
    await expect(page.getByTestId('no-orders')).toBeVisible();
    await page.goto('/#/cart');
    await expect(page.getByTestId('qty-mug')).toHaveText('1');
  });

  test('cancelling the payment prompt places no order', async ({ page }) => {
    await addToCart(page, 'mug');
    await goCheckout(page);
    await page.locator('#cn').fill('4242 4242 4242 4242');
    await page.getByTestId('place-order').click();
    await page.getByTestId('modal-no').click();
    await expect(page.getByTestId('form-error')).toContainText('Order not placed');
    await expect(page.getByTestId('confirmation')).toHaveCount(0);
  });

  test('rapid double-clicks create exactly one order', async ({ page }) => {
    await addToCart(page, 'mug');
    await goCheckout(page);
    await page.locator('#cn').fill('4242 4242 4242 4242');
    await page.getByTestId('place-order').dblclick();
    await expect(page.getByTestId('modal-yes')).toHaveCount(1);
    await page.getByTestId('modal-yes').dblclick();
    await expect(page.getByTestId('confirmation')).toHaveCount(1);
    await page.goto('/#/orders');
    await expect(page.locator('[data-testid^="order-ORD-"]')).toHaveCount(1);
  });
});

test('shop is usable on a phone-sized screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await signUp(page);
  await addToCart(page, 'mug');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(overflow).toBe(false);
  await expect(page.getByTestId('cart-count')).toHaveText('1');
});
