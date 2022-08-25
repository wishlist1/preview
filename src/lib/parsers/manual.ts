import Parser from '@parsers/parser';

export default class Manual implements Parser {
  public indentify(url: string, $: any) {
    let result = false;
    const scehma = $('script[type="application/ld+json"]')
      .map((i, x) => x.children[0] as any)
      .filter((i, x) => x && x.data.match(/\"@type\"(.*?):(.*?)\"Product\"/))
      .get(0);
    if (scehma == undefined || scehma == null || scehma == '') {
      result = true;
    }
    return result;
  }

  public parse(url: string, $: any) {
    const result = {
      url,
      meta: {
        parser: 'manual',
        modifiedDate: new Date().toISOString()
      }
    };

    result['name'] = $('title').text();
    result['image'] = $("meta[name='image']").attr('content');
    result['keywords'] = $("meta[name='keywords']").attr('content');
    result['description'] = $("meta[name='description']").attr('content');

    return result;
  }
}
