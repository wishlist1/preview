import config from 'config';
import { Product, WithContext } from 'schema-dts';
import Parser from '@parsers/parser';

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
    const category = $('.cat-link').text().replace('in ', '');
    const sku = $('#averageCustomerReviews').attr('data-asin');
    const image = $('#imgTagWrapperId img').attr('src');
    const price =
      $('.a-price-whole:first').text() + $('.a-price-fraction:first').text();
    const currency = $('.a-price-symbol:first').text();
    const seller = $('#merchant-info a span:first').text();

    result['sku'] = sku;
    result['image'] = image;

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
        offeredBy: seller
      }
    };
    result['schema'] = schema;

    return result;
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
}
