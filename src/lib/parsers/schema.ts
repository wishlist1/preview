import Parser from '@parsers/parser';

export default class Scehma implements Parser {
  public indentify(url: string, $: any) {
    let result = false;
    const scehma = $('script[type="application/ld+json"]')
      .map((i, x) => x.children[0] as any)
      .filter((i, x) => x && x.data.match(/\"@type\"(.*?):(.*?)\"Product\"/))
      .get(0);
    if (scehma) {
      result = true;
    }
    return result;
  }

  public parse(url: string, $: any) {
    const result = {
      url,
      meta: {
        version: 1,
        parser: 'schema',
        modifiedDate: new Date().toISOString()
      }
    };

    const scehma = $('script[type="application/ld+json"]')
      .map((i, x) => x.children[0] as any)
      .filter((i, x) => x && x.data.match(/\"@type\"(.*?):(.*?)\"Product\"/))
      .get(0);

    const values = JSON.parse(scehma.data);
    let parsedSchema;
    if (Array.isArray(values)) {
      for (const value in values) {
        if (value['@type'] == 'Product') {
          parsedSchema = value;
          break;
        }
      }
    } else {
      parsedSchema = values;
    }

    result['schema'] = parsedSchema;
    result['name'] = parsedSchema.name;
    result['sku'] = parsedSchema.sku;
    result['image'] = parsedSchema.image;
    result['keywords'] = $("meta[name='keywords']").attr('content');
    result['description'] = $("meta[name='description']").attr('content');

    return result;
  }
}
