import { OpaqueModel } from "./Model";
import { ModelAttributes } from "./Contracts";

export type ReverseComparisonTypes<Value> = {
    '==': Value,
    '!=': Value,
    '<': Value,
    '>': Value,
    '<=': Value,
    '>=': Value,
    'in': Value[],
}

export type ComparisonTypes<Value> = {
    [C in keyof typeof Comparison]: ReverseComparisonTypes<Value>[(typeof Comparison)[C]]
}

export enum Comparison {
    _eq = '==',
    _ne = '!=',
    _lt = '<',
    _gt = '>',
    _lte = '<=',
    _gte = '>=',
    _in = 'in'
}

export type Query<O extends Object> = Partial<{
    [P in keyof O]: Partial<ComparisonTypes<O[P]>>
} & {
    _or: Query<O>[],
}>

export type RootQuery<O extends Object> = Query<O> & Partial<{
    _limit: number,
    _skip: number,
}>

export type Queryable = { [key: string]: unknown }

export default class QueryBuilder<Model extends (new () => OpaqueModel) & typeof OpaqueModel> {

    constructor(public model: Model, public $query: Query<ModelAttributes<InstanceType<Model>>> = {}) {

    }

    subQuery(query: Query<ModelAttributes<InstanceType<Model>>>) {
        return new (this.constructor as any)(this.model, query) as this
    }

    where<Attributes extends ModelAttributes<InstanceType<Model>>, Attribute extends keyof Attributes, Key extends keyof ReverseComparisonTypes<Attributes[Attribute]>>(attribute: Attribute, operator: Key, value: ReverseComparisonTypes<Attributes[Attribute]>[Key]) {
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
            _or: [
                ...(this.$query._or || []),
                generator(this.subQuery({})).$query
            ]
        })
    }

    andWhere<Attributes extends ModelAttributes<InstanceType<Model>>, Attribute extends keyof Attributes, Key extends keyof ReverseComparisonTypes<Attributes[Attribute]>>(attribute: Attribute, operator: Key, value: ReverseComparisonTypes<Attributes[Attribute]>[Key]) {
        return this.where(attribute, operator, value)
    }

    orWhere<Attributes extends ModelAttributes<InstanceType<Model>>, Attribute extends keyof Attributes, Key extends keyof ReverseComparisonTypes<Attributes[Attribute]>>(attribute: Attribute, operator: Key, value: ReverseComparisonTypes<Attributes[Attribute]>[Key]) {
        return this.or(query => query.where(attribute, operator, value))
    }

    limit(_limit: number) {
        return this.subQuery({
            ...this.$query,
            _limit,
        })
    }

    skip(_skip: number) {
        return this.subQuery({
            ...this.$query,
            _skip,
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

    async first(): Promise<InstanceType<Model> | undefined> {
        return (await this.limit(1).get())[0]
    }
}