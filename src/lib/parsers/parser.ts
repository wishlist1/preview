import { Result } from '@models/result';

export default interface Parser {
  indentify(url: string, $: any): boolean;

  parse(url: string, $: any): Result;
}
