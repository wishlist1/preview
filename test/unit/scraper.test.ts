import { parse } from '../../src/lib/scraper';

describe('Scraper Testing', () => {
  describe('Parser Testing', () => {
    it('Manual parser with html empty data', async () => {
      const url = "https://test.com";
      const html = "<html></html>";
      const result = parse(url, html);
      expect(result).not.toBeNull();
      expect(result.url).toEqual(url);
      expect(result.name).toEqual("");
      expect(result?.meta?.parser).toEqual("manual");
      expect(result?.meta?.modifiedDate).not.toBeUndefined();
    });
  });
});
