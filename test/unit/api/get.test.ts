import { get } from 'api/preview/get';
import axios, { AxiosResponse } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Preview API Testing', () => {
  describe('Get By Url', () => {
    it('Invalid Url', async () => {
      process.env.IS_OFFLINE = 'true';
      process.env.DYNAMODB_TABLE = 'openwishlist-preview-dev';

      const response: AxiosResponse<string, object> = {
        data: '<html></html>',
        status: 200,
        statusText: 'Succes',
        headers: {},
        config: {}
      };
      mockedAxios.get.mockResolvedValueOnce(response);

      const url = 'eHl6LmluL2RwL0IwOFRUUFo2TVc=';
      const event = {
        pathParameters: {
          url: url
        }
      };
      const result = await get(event);

      expect(result).toBeDefined();
      expect(result.statusCode).toBe(200);

      const body = JSON.parse(result.body);
      expect(body.data.url).toEqual('https://xyz.in/dp/B08TTPZ6MW');
      expect(body.meta.parser).toEqual('manual');
    });
  });
});
