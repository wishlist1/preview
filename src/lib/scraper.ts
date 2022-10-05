import axios from 'axios';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import Schema from '@parsers/schema';
import Amazon from '@parsers/amazon';
import Manual from '@parsers/manual';
import Parser from '@parsers/parser';
import { Result } from '@models/result';
import { get as browser } from '@lib/browser';

const scehma = new Schema();
const amazon = new Amazon();
const manual = new Manual();

async function get(url: string) {
  try {
    const userAgent = new UserAgent({ deviceCategory: 'desktop' });
    const response = await axios.get(url, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        AccessEncoding: 'gzip, deflate, br',
        AcceptLanguage: 'en-US,en;q=0.9',
        CacheControl: 'no-cache',
        UserAgent: userAgent.random().toString()
      }
    });

    const fetchedUrl = response?.request?.res?.responseUrl;
    url = fetchedUrl !== undefined ? fetchedUrl : url;

    if (amazon.blocked(response.data)) {
      response.data = await browser(url);
    }

    return parse(url, response.data);
  } catch (error) {
    console.log(error);
    return {
      url,
      meta: {}
    };
  }
}

function parse(url: string, html: string) {
  let result: Result = {
    url,
    meta: {}
  };

  if (html !== undefined) {
    /**
      // for testing in browser:
      var jq = document.createElement('script');
      jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js";
      document.getElementsByTagName('head')[0].appendChild(jq);
      // ... give time for script to load, then type (or see below for non wait option)
      jQuery.noConflict();
     */

    //console.log(html)

    const $ = cheerio.load(html);
    const parsers: Parser[] = [scehma, amazon, manual];
    for (const parser of parsers) {
      if (parser.indentify(url, $)) {
        result = parser.parse(url, $);
        break;
      }
    }
  }

  return result;
}

export { get, parse };
