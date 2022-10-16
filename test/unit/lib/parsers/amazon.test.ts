import Amazon from '@parsers/amazon';
import { readFileSync } from 'fs';

describe('Amazon Parser Testing', () => {
  describe('Blocked', () => {
    it('Blocked', async () => {
      const html = readFileSync(__dirname + '/amazon.html').toString();

      const amazon = new Amazon();
      const result = amazon.blocked(html);

      expect(result).not.toBeNull();
      expect(result).toBeTruthy();
    });
  });
});
