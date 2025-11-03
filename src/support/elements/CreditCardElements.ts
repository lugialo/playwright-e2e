import { Locator, Page } from '@playwright/test';
import BaseElements from './BaseElements';

export default class CreditCardsElements extends BaseElements {
    constructor(readonly page: Page) {
        super(page);
        this.page = page;
    }

    getFieldCardName(): Locator {
        return this.page.locator('#cc-name');
    }

    getFieldType(): Locator {
        return this.page.locator('#cc-type');
    }

    getCcNumber(): Locator {
        return this.page.locator('#cc-number');
    }

    getCcCsc(): Locator {
        return this.page.locator('#cc-csc');
    }

    getCcExpMonth(): Locator {
        return this.page.locator('#cc-exp-month');
    }

    getCcExpYear(): Locator {
        return this.page.locator('#cc-exp-year');
    }

    
}