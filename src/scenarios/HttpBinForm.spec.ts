// We recommend installing an extension to run playwright tests.
import { test, expect } from '@playwright/test';

const FORM_URL = 'https://httpbin.org/forms/post';

type FormEcho = Record<string, any>;

async function submitAndGetForm(page): Promise<FormEcho> {
    const [response] = await Promise.all([
        page.waitForResponse(r => r.url().includes('/post') && r.request().method() === 'POST'),
        page.waitForURL('**/post'),
        page.locator('form button[type="submit"]').click(),
    ]);
    const data = await response.json();
    return data.form ?? {};
}

function toppingsList(form: FormEcho): string[] {
    if (!('topping' in form)) return [];
    return Array.isArray(form.topping) ? form.topping : [form.topping];
}

test.describe('httpbin.org form', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(FORM_URL);
        await expect(page.locator('form')).toBeVisible();
    });

    test('submit with common values and verify echoed payload', async ({ page }) => {
        await page.locator('input[name="custname"]').fill('Gabriel Tester');
        await page.locator('input[name="custtel"]').fill('11999990000');
        await page.locator('input[name="custemail"]').fill('gabriel@example.com');
        await page.locator('input[name="size"][value="medium"]').check();
        await page.locator('input[name="topping"][value="bacon"]').check();
        await page.locator('input[name="topping"][value="cheese"]').check();
        await page.locator('input[name="delivery"][value="now"]').check();
        await page.locator('textarea[name="comments"]').fill('E2E Playwright test');

        const form = await submitAndGetForm(page);

        expect(form.custname).toBe('Gabriel Tester');
        expect(form.custtel).toBe('11999990000');
        expect(form.custemail).toBe('gabriel@example.com');
        expect(form.size).toBe('medium');
        expect(toppingsList(form)).toEqual(expect.arrayContaining(['bacon', 'cheese']));
        expect(form.delivery).toBe('now');
        expect(form.comments).toBe('E2E Playwright test');
    });

    test('no toppings selected should omit "topping" in payload', async ({ page }) => {
        await page.locator('input[name="custname"]').fill('No Topping User');
        await page.locator('input[name="custtel"]').fill('11888887777');
        await page.locator('input[name="custemail"]').fill('no.topping@example.com');
        await page.locator('input[name="size"][value="small"]').check();
        await page.locator('input[name="delivery"][value="later"]').check();
        await page.locator('textarea[name="comments"]').fill('No toppings, thanks.');

        const form = await submitAndGetForm(page);

        expect(form.size).toBe('small');
        expect(form.delivery).toBe('later');
        expect('topping' in form).toBeFalsy();
    });

    test('radio selection is exclusive (size) and last selection wins', async ({ page }) => {
        await page.locator('input[name="custname"]').fill('Radio User');
        await page.locator('input[name="custtel"]').fill('11777776666');
        await page.locator('input[name="custemail"]').fill('radio@example.com');

        await page.locator('input[name="size"][value="small"]').check();
        await page.locator('input[name="size"][value="medium"]').check();
        await page.locator('input[name="size"][value="large"]').check(); // final selection

        await page.locator('input[name="delivery"][value="now"]').check();

        const form = await submitAndGetForm(page);

        expect(form.size).toBe('large');
    });

    test('request body is urlencoded and contains repeated keys for multiple checkboxes', async ({ page }) => {
        await page.goto(FORM_URL);
        await page.locator('input[name="custname"]').fill('Body Check');
        await page.locator('input[name="custtel"]').fill('11666665555');
        await page.locator('input[name="custemail"]').fill('body.check@example.com');
        await page.locator('input[name="size"][value="medium"]').check();
        await page.locator('input[name="topping"][value="onion"]').check();
        await page.locator('input[name="topping"][value="mushroom"]').check();
        await page.locator('input[name="delivery"][value="later"]').check();

        const [request] = await Promise.all([
            page.waitForRequest(r => r.url().includes('/post') && r.method() === 'POST'),
            page.locator('form button[type="submit"]').click(),
        ]);

        const body = request.postData() || '';
        const params = new URLSearchParams(body);

        expect(params.get('custname')).toBe('Body Check');
        expect(params.get('size')).toBe('medium');
        expect(params.getAll('topping')).toEqual(expect.arrayContaining(['onion', 'mushroom']));
        expect(params.get('delivery')).toBe('later');
    });

    test('email field HTML5 validation prevents submission for invalid email', async ({ page }) => {
        await page.locator('input[name="custname"]').fill('Invalid Email User');
        await page.locator('input[name="custtel"]').fill('11000000000');
        await page.locator('input[name="custemail"]').fill('not-an-email');
        await page.locator('input[name="size"][value="small"]').check();
