import { OpaqueModel } from "./Model";
import { QueryBuilderContract } from "./contracts/QueryBuilder";
import { ModelAttributes } from "./contracts/OpaqueModel";
import { OpaqueRow, SyncAdapterContract, SyncReadAdapterContract, SyncWriteAdapterContract } from "./contracts/OpaqueAdapter";

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

export default class QueryBuilder<Model extends (new () => OpaqueModel) & typeof OpaqueModel> implements QueryBuilderContract<InstanceType<Model>> {

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

    $hydrate(data: OpaqueRow[]) {
        return data.map(attributes => this.model.$fromRow(attributes))
    }

    async get() {
        return this.$hydrate(await this.model.$adapter.read(this.$query))
    }
    async update(data: Partial<ModelAttributes<InstanceType<Model>>>) {
        return this.$hydrate(await this.model.$adapter.update(this.model.$serialize(this.$query), data))
    }
    async delete() {
        return await this.model.$adapter.delete(this.$query)
    }

    async first() {
        return (await this.limit(1).get())[0]
    }

    getSync(this: QueryBuilder<Model & { adapter: () => SyncReadAdapterContract }>) {
        return this.$hydrate(this.model.$getAdapter().readSync(this.$query))
    }
    updateSync(this: QueryBuilder<Model & { adapter: () => SyncWriteAdapterContract }>, data: OpaqueRow) {
        return this.$hydrate(this.model.$getAdapter().updateSync(this.$query, data))
    }
    deleteSync(this: QueryBuilder<Model & { adapter: () => SyncWriteAdapterContract }>) {
        return this.model.$getAdapter().deleteSync(this.$query)
    }

    firstSync(this: QueryBuilder<Model & { adapter: () => SyncReadAdapterContract }>): InstanceType<Model> {
        return this.limit(1).getSync()[0]
    }
}