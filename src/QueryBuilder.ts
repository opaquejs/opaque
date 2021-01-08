import { OpaqueModel } from "./Model";
import { QueryBuilderContract, Query, ReverseComparisonTypes, Comparison } from "./contracts/QueryBuilderContracts";
import { ModelAttributes } from "./contracts/ModelContracts";
import { OpaqueRow, SyncReadAdapterContract, SyncWriteAdapterContract } from "./contracts/AdapterContracts";

export class QueryBuilder<Model extends (new () => OpaqueModel) & typeof OpaqueModel> implements QueryBuilderContract<InstanceType<Model>> {

    constructor(public model: Model, public $query: Query<ModelAttributes<InstanceType<Model>>> = {}) {

    }

    subQuery(query: Query<ModelAttributes<InstanceType<Model>>>) {
        return new (this.constructor as any)(this.model, query) as this
    }

    where<Attributes extends ModelAttributes<InstanceType<Model>>, Attribute extends keyof Attributes, Key extends keyof ReverseComparisonTypes<Attributes[Attribute]>>(attribute: Attribute, operator: Key, value: ReverseComparisonTypes<Attributes[Attribute]>[Key]) {
        return this.subQuery({
            ...this.$query,
            [attribute]: {
                [Object.entries(Comparison).find(([_, literal]) => literal == operator)![0]]: this.model.$serializeAttribute(attribute as string, value)
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