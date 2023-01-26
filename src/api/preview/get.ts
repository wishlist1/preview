'use strict';

import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { get as scrape } from '@lib/scraper';
import { PriceChange, Result } from '@models/result';
import { v4 as uuid } from 'uuid';
import { Offer, PriceSpecification } from 'schema-dts';
import { isEmpty } from 'lodash';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
};

const options = {
  sslEnabled: false,
  region: 'localhost',
  endpoint: 'localhost:8000',
  accessKeyId: 'access_key',
  secretAccessKey: 'secret_key'
};

const isOffline = () => process.env.IS_OFFLINE;
const isTest = () => process.env.JEST_WORKER_ID;

const dynamoDb =
  isOffline() || isTest()
    ? new DynamoDB.DocumentClient(options)
    : new DynamoDB.DocumentClient();

async function get(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const refresh = Boolean(event?.queryStringParameters?.refresh);
  const browser = Boolean(event?.queryStringParameters?.browser);
  const url = event.pathParameters.url;
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    ExpressionAttributeValues: {
      ':url': url
    },
    KeyConditionExpression: '#url = :url',
    ExpressionAttributeNames: {
      '#url': 'url'
    },
    Limit: 1
  };

  // fetch result from the database
  try {
    const output = await dynamoDb.query(params).promise();
    const result = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: null
    };

    let present = false;
    if (output.Items.length !== 0) {
      present = true;
      result.Item = output.Items.pop();
    }

    if (refresh == true || !present) {
      console.log('fetching new');

      let newUrl = Buffer.from(url, 'base64').toString('ascii');
      if (newUrl.toLowerCase().substring(0, 4) !== 'http') {
        newUrl = 'https://' + newUrl;
      }

      const data: Result = await scrape(newUrl, browser);
      if (result.Item == null) {
        data.meta.createdDate = data?.meta?.modifiedDate;
        result.Item = {
          data
        };
      } else {
        data.meta.createdDate = result.Item.data?.meta?.createdDate;
        addPrice(result.Item.data, data);
        addVersion(result.Item.data, data);
        result.Item.data = data;
      }

      const id =
        result.Item.id == null || result.Item.id == undefined
          ? uuid()
          : result.Item.id;
      data.id = id;
      const record = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          id: id,
          url: url,
          data: data
        }
      };
      await dynamoDb.put(record).promise();
    }

    const response = {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 200,
        data: result.Item?.data,
        meta: result.Item?.data?.meta
      })
    };

    return response;
  } catch (error) {
    // handle potential errors
    console.log(error);
    if (error) {
      return {
        statusCode: error.statusCode || 501,
        headers,
        body: '{}'
      };
    }
  }
}

async function getById(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const id = event.pathParameters.id;
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    IndexName: 'idIndex',
    ExpressionAttributeValues: {
      ':id': id
    },
    KeyConditionExpression: '#id = :id',
    ExpressionAttributeNames: {
      '#id': 'id'
    },
    Limit: 1
  };

  // fetch result from the database
  try {
    const result = await dynamoDb.query(params).promise();
    let response = {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        status: 404,
        data: {},
        meta: {}
      })
    };

    if (result.Items.length !== 0) {
      const data = result.Items.pop();
      response = {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 200,
          data: data,
          meta: data.meta
        })
      };
    }

    return response;
  } catch (error) {
    // handle potential errors
    console.log(error);
    if (error) {
      return {
        statusCode: error.statusCode || 501,
        headers,
        body: '{}'
      };
    }
  }
}

function addVersion(oldResult: Result, newResult: Result) {
  const version =
    oldResult?.meta?.version !== undefined ? oldResult?.meta?.version : 1;
  newResult.meta.version = version + 1;
}

function addPrice(oldResult: Result, newResult: Result) {
  const oldOffer: Offer = Array.isArray(oldResult?.schema?.offers)
    ? oldResult?.schema?.offers[0]
    : oldResult?.schema?.offers;
  const oldPrice = oldOffer?.price;

  const newOffer: Offer = Array.isArray(newResult?.schema?.offers)
    ? newResult?.schema?.offers[0]
    : newResult?.schema?.offers;
  const newPrice = newOffer?.price;

  if (!isEmpty(newPrice) && !isEmpty(oldPrice) && oldPrice != newPrice) {
    newResult.priceChangeType =
      oldPrice < newPrice ? PriceChange.Increase : PriceChange.Decrease;
    newResult.priceChange =
      oldPrice < newPrice
        ? parseFloat(newPrice.toString()) - parseFloat(oldPrice.toString())
        : parseFloat(oldPrice.toString()) - parseFloat(newPrice.toString());

    const price: PriceSpecification = {
      '@type': 'PriceSpecification',
      price: oldOffer.price,
      priceCurrency: oldOffer.priceCurrency,
      validFrom: oldResult.meta.modifiedDate,
      validThrough: newResult.meta.modifiedDate
    };

    if (Array.isArray(newResult.prices)) {
      newResult.prices.push(price);
    } else {
      newResult.prices = [price];
    }
  } else {
    newResult.priceChange = oldResult.priceChange;
    newResult.priceChangeType = oldResult?.priceChangeType;
    newResult.prices = oldResult?.prices;
  }
}

export { get, getById };
