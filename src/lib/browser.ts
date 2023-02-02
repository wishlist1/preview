import { isOffline } from '@utils/common';
import puppeteer from 'puppeteer';
import { addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import AdblockerPlugin from 'puppeteer-extra-plugin-adblocker';
import chromium from '@sparticuz/chromium';

async function get(url: string) {
  let result = null;
  let browser = null;
  console.time('browser scraping');
  console.time('scraping time');

  try {
    const options = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
      executablePath: await chromium.executablePath(),
      ignoreHTTPSErrors: true
    };

    if (isOffline()) {
      options.args.push('--remote-debugging-port=9222');
      options.args.push('--remote-debugging-address=0.0.0.0');
    }

    const extra = addExtra(puppeteer);

    const stealth = StealthPlugin();
    stealth.enabledEvasions.delete('user-agent-override');
    extra.use(stealth);

    const adblocker = AdblockerPlugin();
    extra.use(adblocker);

    browser = await extra.launch(options);

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

  console.timeEnd('scraping time');
  return result;
}

export { get };
