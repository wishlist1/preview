'use strict';

import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { get } from '@lib/scraper';
import { Result } from '@models/result';

const options = {
  region: 'localhost',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'access_key',
  secretAccessKey: 'secret_key'
};

const isOffline = () => process.env.IS_OFFLINE;

const dynamoDb = isOffline()
  ? new DynamoDB.DocumentClient(options)
  : new DynamoDB.DocumentClient();

module.exports.get = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const refresh = Boolean(event?.queryStringParameters?.refresh);
  const url = event.pathParameters.url;
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      url: url
    }
  };

  // fetch result from the database
  try {
    const result = await dynamoDb.get(params).promise();

    if (refresh == true || Object.keys(result).length === 0) {
      const newUrl = Buffer.from(url, 'base64').toString('ascii');
      const data: Result = await get(newUrl);
      result.Item = {};
      result.Item.data = data;

      data.meta.createdDate = data?.meta?.modifiedDate;

      const record = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          url: url,
          data: data
        }
      };
      await dynamoDb.put(record).promise();
      console.log('fetching new');
    }

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true // Required for cookies, authorization headers with HTTP
      },
      body: JSON.stringify({
        status: 200,
        data: result.Item.data,
        meta: result.Item.meta
      })
    };

    return response;
  } catch (error) {
    // handle potential errors
    console.log(error);
    if (error) {
      return {
        statusCode: error.statusCode || 501,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*', // Required for CORS support to work
          'Access-Control-Allow-Credentials': true // Required for cookies, authorization headers with HTTP
        },
        body: '{}'
      };
    }
  }
};
