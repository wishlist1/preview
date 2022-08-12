'use strict';

import { DynamoDB } from 'aws-sdk';
import { get } from './lib/scraper';
import { Result } from './models/result';

const options = {
  region: "localhost",
  endpoint: "http://localhost:8000",
  accessKeyId: "access_key",
  secretAccessKey: "secret_key"
}

let isOffline = () => process.env.IS_OFFLINE

const dynamoDb = isOffline() ? new DynamoDB.DocumentClient(options) : new DynamoDB.DocumentClient()


module.exports.get = async (event) => {
  const refresh = event?.query?.refresh
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
        url: event.path.url,
    },
  };

  // fetch result from the database
  try {
    const result = await dynamoDb.get(params).promise();
  
    if (refresh == undefined || Object.keys(result).length === 0) {
      const newUrl = Buffer.from(event.path.url, 'base64').toString('ascii');
      const data: Result = await get(newUrl);
      result.Item = {};
      result.Item.data = data;
      let record = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
            url: event.path.url,
            data: data
        },
      }
      await dynamoDb.put(record).promise()
      console.log("fetching new")
    }
    
    let response = {
      status: 200,
      data: result.Item.data,
    };

  return response;
  } catch(error) {
    // handle potential errors
    console.log(error)
    if (error) {
      return {
        status: error.statusCode || 501,
        error:  error.message,
        data: {}
      };
    }
  }
};