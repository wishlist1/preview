"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const user_agents_1 = __importDefault(require("user-agents"));
function get(url) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userAgent = new user_agents_1.default({ deviceCategory: "desktop" });
            const response = yield axios_1.default.get(url, {
                headers: {
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                    AccessEncoding: "gzip, deflate, br",
                    AcceptLanguage: "en-US,en;q=0.9",
                    CacheControl: "no-cache",
                    UserAgent: userAgent.random().toString(),
                },
            });
            return parse(url, response.data);
        }
        catch (error) {
            console.log(error);
            return {
                url,
            };
        }
    });
}
exports.get = get;
function parse(url, html) {
    let result = {
        url,
    };
    if (html !== undefined) {
        const $ = cheerio.load(html);
        // case 1: use the schema
        const scehma = $('script[type="application/ld+json"]')
            .map((i, x) => x.children[0])
            .filter((i, x) => x && x.data.match(/\"@type\"(.*?):(.*?)\"Product\"/))
            .get(0);
        if (scehma) {
            let parsedSchema = JSON.parse(scehma.data);
            result["schema"] = parsedSchema;
            result["name"] = parsedSchema.name;
            result["sku"] = parsedSchema.sku;
            result["image"] = parsedSchema.image;
            result["keywords"] = $("meta[name='keywords']").attr('content');
            result["description"] = $("meta[name='description']").attr('content');
        }
        else {
            // case 2: prepare result
            result["name"] = $('title').text();
            result["image"] = $("meta[name='image']").attr('content');
            result["keywords"] = $("meta[name='keywords']").attr('content');
            result["description"] = $("meta[name='description']").attr('content');
        }
    }
    return result;
}
