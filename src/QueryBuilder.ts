import { OpaqueModel } from "./Model";
import { ModelAttributes } from "./Contracts";
import { OpaqueAdapter } from "./Adapter";
import { Constructor } from "./util";
import { OpaqueQuery } from "./Query";

export type ComparisonTypes<Value> = {
    '==': Value,
    '!=': Value,
    '<': Value,
    '>': Value,
    '>=': Value,
    '<=': Value,
    'in': Value[],
}

export enum Comparison {
    $eq = '==',
    $ne = '!=',
    $lt = '<',
    $gt = '>',
    $lte = '<=',
    $gte = '>=',
    $in = 'in'
}

export type Query<O extends Object> = Partial<{
    [P in keyof O]: Partial<ComparisonTypes<O[P]>> | O[P]
} & {
    $or: Query<O>[],
}>

export type RootQuery<O extends Object> = Query<O> & Partial<{
    $limit: number,
    $skip: number,
}>

export type Queryable = { [key: string]: unknown }

export default class QueryBuilder<Model extends (new () => OpaqueModel) & typeof OpaqueModel> {

    constructor(public model: Model, public $query: Query<ModelAttributes<InstanceType<Model>>> = {}) {

    }

    subQuery(query: Query<ModelAttributes<InstanceType<Model>>>) {
        return new (this.constructor as any)(this.model, query) as this
    }

    where<Attribute extends keyof ModelAttributes<InstanceType<Model>>, Key extends keyof ComparisonTypes<ModelAttributes<InstanceType<Model>>[Attribute]>>(attribute: Attribute, operator: Key, value: ComparisonTypes<ModelAttributes<InstanceType<Model>>[Attribute]>[Key]) {
        return this.subQuery({
            ...this.$query,
            [attribute]: {
                [Object.entries(Comparison).find(([_, literal]) => literal == operator)![0]]: value
            }
        })
    }

    or(generator: (query: this) => this) {
        return this.subQuery({
            ...this.$query,
            $or: [
                ...(this.$query.$or || []),
                generator(this.subQuery({})).$query
            ]
        })
    }

    andWhere<Attribute extends keyof ModelAttributes<InstanceType<Model>>, Key extends keyof ComparisonTypes<ModelAttributes<InstanceType<Model>>[Attribute]>>(attribute: Attribute, operator: Key, value: ComparisonTypes<ModelAttributes<InstanceType<Model>>[Attribute]>[Key]) {
        return this.where(attribute, operator, value)
    }

    orWhere<Attribute extends keyof ModelAttributes<InstanceType<Model>>, Key extends keyof ComparisonTypes<ModelAttributes<InstanceType<Model>>[Attribute]>>(attribute: Attribute, operator: Key, value: ComparisonTypes<ModelAttributes<InstanceType<Model>>[Attribute]>[Key]) {
        return this.or(query => query.where(attribute, operator, value))
    }

    limit($limit: number) {
        return this.subQuery({
            ...this.$query,
            $limit,
        })
    }

    skip($skip: number) {
        return this.subQuery({
            ...this.$query,
            $skip,
        })
    }

    async get() {
        return (await this.model.$adapter.read(this.$query)).map(attributes => this.model.$fromStorage(attributes))
    }
    async update(data: Partial<Model>) {
        return await this.model.$adapter.update(this.$query, data)
    }
    async delete() {
        return await this.model.$adapter.delete(this.$query)
    }

    async first(): Promise<ModelAttributes<InstanceType<Model>> | undefined> {
        return (await this.limit(1).get())[0]
    }
}