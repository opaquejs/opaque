import { OpaqueModel, attribute } from "./Model";
import { ModelAttributes } from "./Contracts";

export type Comparisons<Value> = {
    $eq: Value,
    $ne: Value,
    $lt: Value,
    $lte: Value,
    $gt: Value,
    $gte: Value,
    $in: Value[],
}

export type Query<O extends Object> = Partial<{
    [P in keyof O]: Partial<Comparisons<O[P]>> | O[P]
} & {
    $or: Query<O>[],
}>

export type RootQuery<O extends Object> = Query<O> & Partial<{
    $limit: number,
    $skip: number,
}>

export type Queryable = { [key: string]: unknown }

export enum Comparison {
    $ne = '!=',
    $eq = '==',
    $lt = '<',
    $gt = '>',
    $lte = '<=',
    $gte = '>=',
}

export type ComparisonFunctions<Value> = {
    [P in keyof Comparisons<Value>]: (right: Comparisons<Value>[P]) => boolean
}

export const comparisonFunctions = <Value>(left: Value) => ({
    $eq: (right) => left == right,
    $gt: right => left > right,
    $gte: right => left >= right,
    $lt: right => left < right,
    $lte: right => left <= right,
    $ne: right => left != right,
    $in: right => right.includes(left),
} as ComparisonFunctions<Value>)

export default class QueryBuilder<Model extends typeof OpaqueModel> {

    constructor(public model: Model, protected $query: Query<ModelAttributes<InstanceType<Model>>> = {}) {

    }

    where<Attribute extends keyof ModelAttributes<InstanceType<Model>>>(attribute: Attribute, operator: Comparison, value: InstanceType<Model>[Attribute]) {
        return new (this.constructor as typeof QueryBuilder)(this.model, {
            ...this.$query,
            [attribute]: {
                [Object.keys(Comparison).find(key => Comparison[key as keyof typeof Comparison] == operator)!]: value
            }
        })
    }

    limit($limit: number) {
        return new (this.constructor as typeof QueryBuilder)(this.model, {
            ...this.$query,
            $limit,
        })
    }

    async get() {
        return (await this.model.$adapter.read(this.$query)).map(attributes => this.model.$fromStorage(attributes))
    }
    async update(data: Partial<ModelAttributes<InstanceType<Model>>>) {
        return await this.model.$adapter.update(this.$query, data)
    }
    async delete() {
        return await this.model.$adapter.delete(this.$query)
    }

    async first() {
        return (await this.limit(1).get())[0]
    }
}

export const matchesComparison = <Value, C extends Comparisons<Value>, PC extends keyof C>(left: Value, comparison: PC, right: C[PC]) => {
    return (comparisonFunctions(left) as any)[comparison](right) as boolean
}

export const matchesComparisons = <Value>(left: Value, comparisons: Comparisons<Value>) => {
    for (const type in comparisons) {
        if (!matchesComparison(left, type as keyof typeof comparisons, comparisons[type as keyof typeof comparisons])) {
            return false;
        }
    }
    return true
}

export const matchesQuery = <T extends Queryable>(object: T, query: Query<T>) => {
    for (const key in query) {
        const value = object[key as keyof typeof object]
        const comparisons = query[key as keyof typeof object]
        if (key == '$or' && Array.isArray(query['$or'])) {
            if (!query['$or'].map(subquery => matchesQuery(object, subquery)).includes(true)) {
                return false
            }
        } else if (!key.startsWith('$')) {
            if (!matchesComparisons(value, (typeof comparisons == 'object' ? comparisons : { $eq: comparisons }) as Comparisons<typeof value>)) {
                return false
            }
        }
    }
    return true
}

export const queryCollection = <T extends Queryable>(collection: T[], query: RootQuery<T>): T[] => {
    if (query.$skip != undefined) {
        collection = collection.slice(Math.max(0, query.$skip))
    }
    if (query.$limit != undefined) {
        collection = collection.slice(0, Math.max(0, query.$limit))
    }
    return collection
}