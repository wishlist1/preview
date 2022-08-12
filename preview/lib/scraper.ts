import axios from "axios"
import * as cheerio from "cheerio"
import UserAgent from "user-agents"
import { Product, WithContext } from "schema-dts"

async function get(url: string) {
  try {
    const userAgent = new UserAgent({ deviceCategory: "desktop" });
    const response = await axios.get(url, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        AccessEncoding: "gzip, deflate, br",
        AcceptLanguage: "en-US,en;q=0.9",
        CacheControl: "no-cache",
        UserAgent: userAgent.random().toString(),
      },
    })

    return parse(url, response.data);
  } catch (error) {
    console.log(error);
    return {
      url,
    };
  }
}

function parse(url: string, html) {
  let result = {
    url,
  }

  if (html !== undefined) {
    const $ = cheerio.load(html)

    // case 1: use the schema
    const scehma = $('script[type="application/ld+json"]')
      .map((i, x) => x.children[0] as any)
      .filter((i, x) => x && x.data.match(/\"@type\"(.*?):(.*?)\"Product\"/))
      .get(0)
    if (scehma) {
      let parsedSchema: WithContext<Product> = JSON.parse(scehma.data)
      result["schema"] = parsedSchema
      result["name"] = parsedSchema.name
      result["sku"] = parsedSchema.sku
      result["image"] = parsedSchema.image
      result["keywords"] = $("meta[name='keywords']").attr('content')
      result["description"] = $("meta[name='description']").attr('content')
    } else {
      // case 2: prepare result
      result["name"] = $('title').text()
      result["image"] = $("meta[name='image']").attr('content')
      result["keywords"] = $("meta[name='keywords']").attr('content')
      result["description"] = $("meta[name='description']").attr('content')
    }
  }

  return result
}

export { get };
