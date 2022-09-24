import config from 'config';
import { Product, Review, WithContext } from 'schema-dts';
import Parser from '@parsers/parser';
import { isEmpty } from 'lodash';

export default class Amazon implements Parser {
  public indentify(url: string, $: any) {
    let result = false;
    const endpoint = new URL(url);
    const domain = endpoint.hostname.replace('www.', '');
    const domains: Array<string> = config.get('amazon.domains');

    if (domains.includes(domain)) {
      result = true;
    }

    return result;
  }

  public parse(url: string, $: any) {
    const result = {
      url,
      meta: {
        version: 1,
        parser: 'amazon',
        modifiedDate: new Date().toISOString()
      }
    };

    const name = $('title').text();
    result['name'] = name;

    result['image'] = $("meta[name='image']").attr('content');
    result['keywords'] = $("meta[name='keywords']").attr('content');

    const description = $("meta[name='description']").attr('content');
    result['description'] = description;

    const brand = this.getBrand($);
    let category = $('.cat-link').text().replace('in ', '');
    if (isEmpty(category)) {
      category = $('#wayfinding-breadcrumbs_feature_div li:first')
        .text()
        .replace(/^\s+|\s+$/g, '');
    }
    const sku = $('#averageCustomerReviews').attr('data-asin');
    const image = $('#imgTagWrapperId img').attr('src');
    const price =
      $('.a-price-whole:first').text() + $('.a-price-fraction:first').text();
    const currency = $('.a-price-symbol:first').text();
    const seller = $('#merchant-info a span:first').text();

    result['sku'] = sku;
    result['image'] = image;
    result['keywords'] = this.getKeywords($, brand);

    const schema: WithContext<Product> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name,
      category: category,
      brand: brand,
      sku: sku,
      image: image,
      description: description,
      url: url,
      offers: {
        '@type': 'Offer',
        '@id': sku,
        price: price,
        priceCurrency: currency,
        sku: sku,
        offeredBy: seller,
        review: this.getReview($)
      }
    };

    const details = this.getDetails($);
    for (const k in details) {
      schema[k] = details[k];
    }

    result['schema'] = schema;

    return result;
  }

  private getKeywords($: any, brand) {
    const keywords = [brand];
    const categories = $('#wayfinding-breadcrumbs_feature_div li a');
    if (!isEmpty(categories)) {
      for (const item of categories) {
        const value = $(item)
          .find('.a-list-item > span:nth-child(2)')
          .text()
          .replace(/^\s+|\s+$/g, '')
          .replace(/[^\x00-\x7F]/g, '');
        keywords.push(value);
      }
    }
    return keywords.join(',');
  }

  private getBrand($: any) {
    const brandLink = $('#bylineInfo').attr('href');
    const brandRegex = new RegExp('/stores/(.*)/page/', 'g');
    const matches = brandRegex.exec(brandLink);

    let brand = $('#bylineInfo')
      .text()
      .replace('Brand: ', '')
      .replace('Visit the ', '');
    if (matches && matches[1]) {
      brand = matches[1];
    }

    return brand;
  }

  private getReview($: any) {
    const review: Review = {
      '@type': 'Review'
    };
    const ratingText = $("i[data-hook='average-star-rating']").text();
    if (!isEmpty(ratingText)) {
      const ratingRegex = new RegExp('(.*) out of (.*) stars', 'g');
      const matches = ratingRegex.exec(ratingText);
      review.reviewRating = {
        '@type': 'Rating',
        bestRating: matches[2],
        ratingValue: matches[1]
      };
    }

    return review;
  }

  private getDetails($: any) {
    const mapping = {
      CountryofOrigin: {
        attribute: 'countryOfOrigin',
        value: (value) => value
      },
      ItemWeight: {
        attribute: 'weight',
        value: (value) => {
          return {
            '@type': 'QuantitativeValue',
            value: value
          };
        }
      },
      Manufacturer: {
        attribute: 'manufacturer',
        value: (value) => value
      },
      Itemmodelnumber: {
        attribute: 'mpn',
        value: (value) => value
      },
      'MaterialType(s)': {
        attribute: 'material',
        value: (value) => value
      },
      Color: {
        attribute: 'color',
        value: (value) => value
      }
    };

    const details = {};
    let list = $('#detailBullets_feature_div').find('li');
    if (!isEmpty(list)) {
      for (const item of list) {
        const key = $(item)
          .find('.a-text-bold')
          .text()
          .replace(/(?:\r\n|\r|\n|:|\s+)/g, '')
          .replace(/[^\x00-\x7F]/g, '');
        const value = $(item)
          .find('.a-list-item > span:nth-child(2)')
          .text()
          .replace(/^\s+|\s+$/g, '')
          .replace(/[^\x00-\x7F]/g, '');
        if (mapping[key]) {
          details[mapping[key]['attribute']] = mapping[key]['value'](value);
        }
      }
    }

    // Technical Details
    list = $('#productDetails_techSpec_section_1').find('tr');
    if (!isEmpty(list)) {
      for (const item of list) {
        const key = $(item)
          .find('.prodDetSectionEntry')
          .text()
          .replace(/(?:\r\n|\r|\n|:|\s+)/g, '')
          .replace(/[^\x00-\x7F]/g, '');
        const value = $(item)
          .find('.prodDetAttrValue')
          .text()
          .replace(/^\s+|\s+$/g, '')
          .replace(/[^\x00-\x7F]/g, '');
        if (mapping[key]) {
          details[mapping[key]['attribute']] = mapping[key]['value'](value);
        }
      }
    }

    return details;
  }
}
