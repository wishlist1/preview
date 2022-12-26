import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

async function get(url: string) {
  let result = null;
  let browser = null;
  console.log('chrome scraping');

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    console.log(page);

    await page.goto(url);

    result = await page.content();
  } catch (error) {
    console.log(error);

    return result;
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }

  console.log(result);
  return result;
}

export { get };
