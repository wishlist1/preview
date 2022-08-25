import axios from 'axios';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import Schema from '@parsers/schema';
import Amazon from '@parsers/amazon';
import Manual from '@parsers/manual';
import Parser from '@parsers/parser';
import { Result } from '@models/result';

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

    return parse(url, response.data);
  } catch (error) {
    console.log(error);
    return {
      url
    };
  }
}

function parse(url: string, html: string) {
  let result: Result = {
    url
  };

  if (html !== undefined) {
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
