import { Product, WithContext } from 'schema-dts';

interface Meta {
  parser?: string;
  createdDate?: string;
  modifiedDate?: string;
}

export interface Result {
  url: string;
  image?: string;
  name?: string;
  sku?: string;
  keywords?: string;
  description?: string;
  schema?: WithContext<Product>;
  meta?: Meta;
}
