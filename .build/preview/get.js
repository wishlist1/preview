'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const scraper_1 = require("./lib/scraper");
const options = {
    region: "localhost",
    endpoint: "http://localhost:8000",
    accessKeyId: "access_key",
    secretAccessKey: "secret_key"
};
let isOffline = () => process.env.IS_OFFLINE;
const dynamoDb = isOffline() ? new aws_sdk_1.DynamoDB.DocumentClient(options) : new aws_sdk_1.DynamoDB.DocumentClient();
module.exports.get = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const refresh = (_a = event === null || event === void 0 ? void 0 : event.query) === null || _a === void 0 ? void 0 : _a.refresh;
    const params = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
            url: event.path.url,
        },
    };
    // fetch result from the database
    try {
        const result = yield dynamoDb.get(params).promise();
        if (refresh == undefined || Object.keys(result).length === 0) {
            const newUrl = Buffer.from(event.path.url, 'base64').toString('ascii');
            const data = yield (0, scraper_1.get)(newUrl);
            result.Item = {};
            result.Item.data = data;
            let record = {
                TableName: process.env.DYNAMODB_TABLE,
                Item: {
                    url: event.path.url,
                    data: data
                },
            };
            yield dynamoDb.put(record).promise();
            console.log("fetching new");
        }
        let response = {
            status: 200,
            data: result.Item.data,
        };
        return response;
    }
    catch (error) {
        // handle potential errors
        console.log(error);
        if (error) {
            return {
                status: error.statusCode || 501,
                error: error.message,
                data: {}
            };
        }
    }
});
