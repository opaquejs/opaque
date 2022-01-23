import { AtomicComparison, ComparisonTypes, NormalizedQuery, NormalizedSubQuery } from "@opaquejs/query";
import { OpaqueAttributes, OpaqueRow, OpaqueTable, OpaqueTableInterface } from "./contracts/ModelContracts";
import {
  QueryBuilderInterface,
  QueryBuilderModifier,
  QueryBuilderContract,
  QueryBuilderStaticContract,
} from "./contracts/QueryBuilderContracts";

const isEmptyQuery = (query: NormalizedQuery): query is {} => {
  return Object.getOwnPropertyNames(query).length == 0;
};

export type WhereParams = [string | QueryBuilderModifier<any>, (keyof ComparisonTypes<any> | unknown)?, unknown?];

export class QueryBuilderImplementation implements QueryBuilderInterface {
  constructor(public model: OpaqueTableInterface, public $query: NormalizedQuery = {}) {}

  for(key: unknown) {
    return this.where(this.model.primaryKey, "==", key);
  }

  $getQuery() {
    return this.$query;
  }
  $getSubQuery() {
    return Object.fromEntries(
      Object.entries(this.$getQuery()).filter(([key]) => !["_limit", "_skip"].includes(key))
    ) as NormalizedSubQuery;
  }
  $getRootParts() {
    return Object.fromEntries(
      Object.entries(this.$getQuery()).filter(([key]) => ["_limit", "_skip", "_orderBy"].includes(key))
    ) as Pick<NormalizedQuery, "_limit" | "_skip" | "_orderBy">;
  }

  $cloneForQuery(query: NormalizedQuery) {
    return new (this.constructor as any)(this.model, query) as this;
  }

  where(...[attribute, operator, value]: WhereParams): this {
    if (typeof attribute == "function") {
      return this.$andQuery(attribute(this.$cloneForQuery({})).$getSubQuery());
    }
    if (value === undefined) {
      return this.where(attribute, "==", operator);
    }
    return this.$andQuery(this.$makeComparison(attribute, operator as keyof ComparisonTypes<any>, value));
  }
  orWhere(...params: WhereParams): this {
    return this.or((query) => query.where(...params));
  }
  andWhereNot(...params: WhereParams): this {
    return this.$andQuery({
      _not: this.$cloneForQuery({})
        .where(...params)
        .$getSubQuery(),
    });
  }
  orWhereNot(...params: WhereParams): this {
    return this.$orQuery({
      _not: this.$cloneForQuery({})
        .where(...params)
        .$getSubQuery(),
    });
  }
  get whereNot() {
    return this.andWhereNot.bind(this);
  }
  get andWhere() {
    return this.where.bind(this);
  }

  $connectQuery(connector: "_and" | "_or", query: NormalizedQuery) {
    const basequery = this.$getSubQuery();
    const rootparts = this.$getRootParts();
    if (connector in basequery) {
      return this.$cloneForQuery({
        ...rootparts,
        ...basequery,
        [connector]: [...(basequery as any)[connector], query],
      });
    }
    if (isEmptyQuery(basequery)) {
      return this.$cloneForQuery({ ...rootparts, ...query });
    }
    return this.$cloneForQuery({ ...rootparts, [connector]: [basequery, query] });
  }
  $andQuery(query: NormalizedQuery) {
    return this.$connectQuery("_and", query);
  }
  $orQuery(query: NormalizedQuery) {
    return this.$connectQuery("_or", query);
  }

  $makeComparison(attribute: string, operator: keyof ComparisonTypes<any>, value: unknown): AtomicComparison {
    return {
      key: attribute,
      comparator: operator,
      value:
        operator == "in"
          ? (value as unknown[]).map((value) => this.model.$serializeAttribute(attribute as any, value))
          : this.model.$serializeAttribute(attribute as any, value),
    } as AtomicComparison;
  }

  limit(_limit: number) {
    return this.$cloneForQuery({
      ...this.$getQuery(),
      _limit,
    });
  }

  skip(_skip: number) {
    return this.$cloneForQuery({
      ...this.$getQuery(),
      _skip,
    });
  }

  orderBy(key: string, direction: "asc" | "desc" = "asc") {
    return this.$cloneForQuery({
      ...this.$getQuery(),
      _orderBy: [...(this.$getRootParts()._orderBy || []), { key, direction }],
    });
  }

  or(modifier: QueryBuilderModifier<this>) {
    return this.$orQuery(modifier(this.$cloneForQuery({})).$getSubQuery());
  }
  and(modifier: QueryBuilderModifier<this>) {
    return this.$andQuery(modifier(this.$cloneForQuery({})).$getSubQuery());
  }
  not(modifier: QueryBuilderModifier<this>) {
    return this.$andQuery({ _not: modifier(this.$cloneForQuery({})).$getSubQuery() });
  }

  $hydrate(data: OpaqueAttributes): OpaqueRow;
  $hydrate(data: OpaqueAttributes[]): OpaqueRow[];
  $hydrate(data: OpaqueAttributes[] | OpaqueAttributes) {
    if (Array.isArray(data)) {
      return data.map((attributes) => this.model.$fromRow(attributes));
    }
    return this.model.$fromRow(data);
  }

  async get() {
    return this.$hydrate(await this.model.adapter.read(this.model, this.$query));
  }
  async update(data: OpaqueAttributes) {
    return await this.model.adapter.update(this.model, this.$query, data);
  }
  async delete() {
    return await this.model.adapter.delete(this.model, this.$query);
  }

  async first() {
    return (await this.limit(1).get())[0];
  }

  apply(this: this & { model: { scopes: Record<string, any> } }, scopename: string, ...args: any[]) {
    return this.where(this.model.scopes[scopename](...args));
  }

  toDebugString() {
    const visitor = (query: NormalizedQuery): string => {
      if ("_and" in query) {
        return `(${query._and.map((sub) => visitor(sub)).join(" and ")})`;
      }
      if ("_or" in query) {
        return `(${query._or.map((sub) => visitor(sub)).join(" or ")})`;
      }
      if ("_not" in query) {
        return `not (${visitor(query._not)})`;
      }
      if ("value" in query) {
        return `('${query.key}' ${query.comparator} [${query.value}])`;
      }
      return `!!UNKNOWN!!`;
    };
    return visitor(this.$query);
  }
}

export type QueryBuilder<Model extends OpaqueTable> = QueryBuilderContract<Model>;
export const QueryBuilder: QueryBuilderStaticContract = QueryBuilderImplementation as any;
