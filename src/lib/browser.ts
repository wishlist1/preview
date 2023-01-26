import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

async function get(url: string) {
  let result = null;
  let browser = null;
  console.log('chrome scraping');

  try {
    const options = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
      executablePath: await chromium.executablePath(),
      ignoreHTTPSErrors: true
    };

    browser = await puppeteer.launch(options);

    const page = await browser.newPage();

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

  return result;
}

export { get };
