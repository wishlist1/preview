import { PriceSpecification, Product, WithContext } from 'schema-dts';

interface Meta {
  parser?: string;
  createdDate?: string;
  modifiedDate?: string;
  version?: number;
}

export enum PriceChange {
  Increase = 'increase',
  Decrease = 'decrease',
  NoChange = 'nochange'
}

export interface Result {
  url: string;
  id?: string;
  image?: string;
  name?: string;
  sku?: string;
  keywords?: string;
  description?: string;
  schema?: WithContext<Product>;
  priceChangeType?: PriceChange;
  priceChange?: number;
  prices?: PriceSpecification[];
  meta?: Meta;
}
