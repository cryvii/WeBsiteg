import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function testCalendar() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to admin page...');
        await page.goto('http://localhost:5173/admin');
        await page.waitForLoadState('networkidle');

        // Take screenshot of login page
        await page.screenshot({ path: 'artifacts/01_login_page.png', fullPage: true });
        console.log('✓ Captured login page');

        // Login
        console.log('Logging in...');
        await page.fill('input[type="text"]', 'Test');
        await page.fill('input[type="password"]', 'test123');
        await page.click('button[type="submit"]');

        // Wait for dashboard to load
        await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });
        await page.waitForTimeout(2000); // Give calendar time to render

        // Take screenshot of full dashboard
        await page.screenshot({ path: 'artifacts/02_full_dashboard.png', fullPage: true });
        console.log('✓ Captured full dashboard');

        // Take screenshot focused on calendar
        const calendar = await page.locator('text=December 2025').locator('..').locator('..');
        if (calendar) {
            await calendar.screenshot({ path: 'artifacts/03_calendar_december.png' });
            console.log('✓ Captured December calendar');
        }

        // Check commission list
        const commissionElements = await page.locator('.bg-slate-800.rounded-lg').count();
        console.log(`Found ${commissionElements} commission cards`);

        // Navigate to next month (January 2026) if possible
        const nextButton = page.locator('text=Next');
        if (await nextButton.isVisible()) {
            await nextButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'artifacts/04_calendar_january.png' });
            console.log('✓ Captured January calendar');

            // Go back
            await page.locator('text=Previous').click();
            await page.waitForTimeout(1000);
        }

        // Take a screenshot of the commission list section
        const commissionList = await page.locator('.lg\\:col-span-7').first();
        if (commissionList) {
            await commissionList.screenshot({ path: 'artifacts/05_commission_list.png' });
            console.log('✓ Captured commission list');
        }

        console.log('\n✓ All screenshots captured successfully!');
        console.log('Screenshots saved to artifacts/ directory');

    } catch (error) {
        console.error('Error during automation:', error);
        await page.screenshot({ path: 'artifacts/error.png', fullPage: true });
    } finally {
        await browser.close();
    }
}

testCalendar();
