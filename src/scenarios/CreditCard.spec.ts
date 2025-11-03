import { test, expect } from '@playwright/test';
import CreditCardElements from '../support/elements/CreditCardElements';
import { ai } from '@zerostep/playwright';

test.describe('Credit Card Payment Tests', () => {
  let elements: CreditCardElements;

  test.beforeEach(async ({ page }) => {
    elements = new CreditCardElements(page);
    await page.goto('https://fill.dev/form/credit-card-simple');
  });

  test('deve validar se as informações foram inseridas com sucesso', async ({ page }) => {
    // await elements.getFieldCardName().fill('John Doe');
    // await elements.getFieldType().selectOption('Visa');
    // await elements.getCcNumber().fill('4111111111111111');
    // await elements.getCcCsc().fill('123');
    // await elements.getCcExpMonth().selectOption('12');
    // await elements.getCcExpYear().selectOption('2025');

    const aiArgs = { page, test };
    await ai('enter all the values in the form and click on Pay',aiArgs);
    
    // await page.click('button[type="submit"]');
    await expect(page).toHaveURL('https://fill.dev/submit', test);
  });

  test('deve validar se todos os campos obrigatórios estão preenchidos', async ({ page }) => {
    await elements.getFieldCardName().fill('Incomplete User');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('https://fill.dev/form/credit-card-simple');
    
    await expect(elements.getCcNumber()).toHaveAttribute('required', '');
    await expect(elements.getCcCsc()).toHaveAttribute('required', '');
  });

  test('deve validar campos obrigatórios antes da submissão dos dados', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(elements.getFieldCardName()).toHaveAttribute('required', '');
    await expect(elements.getCcNumber()).toHaveAttribute('required', '');
    await expect(elements.getCcCsc()).toHaveAttribute('required', '');
  });
});