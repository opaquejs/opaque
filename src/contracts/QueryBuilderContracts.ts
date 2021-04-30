import { ComparisonTypes, NormalizedQuery } from "@opaquejs/query";
import {
  ModelAttributes,
  OpaqueAttributes,
  OpaqueRowInterface,
  OpaqueTable,
  OpaqueTableInterface,
} from "./ModelContracts";

export type QueryBuilderModifier<QueryBuilder extends QueryBuilderInterface> = (query: QueryBuilder) => QueryBuilder;

export interface QueryBuilderStaticContract {
  new <Model extends OpaqueTable>(model: Model, $query?: NormalizedQuery): QueryBuilderContract<Model>;
}

export interface QueryBuilderInterface {
  // Needed for interface
  for(id: unknown): this;
  $getQuery(): NormalizedQuery;

  // Querying
  where(attribute: string, operator: keyof ComparisonTypes<any>, value: unknown): this;
  where(attribute: string, value: unknown): this;
  where(modifier: QueryBuilderModifier<this>): this;
  whereNot: this["where"];
  andWhere: this["where"];
  orWhere: this["where"];

  limit(limit: number): this;
  skip(skip: number): this;
  orderBy(key: string, direction?: "asc" | "desc"): this;

  get(): Promise<OpaqueRowInterface[]>;
  first(): Promise<OpaqueRowInterface>;

  update(data: OpaqueAttributes): Promise<void>;
  delete(): Promise<void>;
}
export interface QueryBuilderContract<Model extends OpaqueTableInterface> extends QueryBuilderInterface {
  model: Model;
  // Querying
  where<
    Attributes extends ModelAttributes<InstanceType<Model>>,
    Attribute extends keyof Attributes,
    Key extends keyof ComparisonTypes<any>
  >(
    attribute: Attribute,
    operator: Key,
    value: ComparisonTypes<Attributes[Attribute]>[Key]
  ): this;
  where<Attributes extends ModelAttributes<InstanceType<Model>>, Attribute extends keyof Attributes>(
    attribute: Attribute,
    value: ComparisonTypes<Attributes[Attribute]>["=="]
  ): this;
  where(modifier: QueryBuilderModifier<this>): this;

  orderBy(key: keyof ModelAttributes<InstanceType<Model>>, direction?: "asc" | "desc"): this;

  apply<This extends { model: OpaqueTable & { scopes: Record<string, any> } }>(
    this: This,
    key: keyof This["model"]["scopes"],
    ...args: any[]
  ): this;

  get(): Promise<InstanceType<Model>[]>;
  first(): Promise<InstanceType<Model>>;
}
