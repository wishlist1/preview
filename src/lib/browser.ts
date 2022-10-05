import chromium from 'chrome-aws-lambda';

async function get(url: string) {
  let result = null;
  let browser = null;
  console.log('chrome scaping');

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true
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
