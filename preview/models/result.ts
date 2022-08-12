import {Product, WithContext} from 'schema-dts';

export interface Result {
    url: string;
    image?: string;
    name?: string;
    sku?: string;
    keywords?: string;
    description?: string;
    schema?: WithContext<Product>
}