import { IdType, ModelAttributes } from "./Contracts"
import { OpaqueModel, attribute } from "./Model"
import { OpaqueQuery } from "./Query"
import { OpaqueAdapter } from "./Adapter"
import { v4 } from "uuid"
import { Constructor } from "./util"

export class RuntimeOpaqueQuery<Model extends typeof OpaqueModel> implements OpaqueQuery<Model> {
    constructor(public model: Model, public storage: ModelAttributes<InstanceType<Model>>[]) {
    }

    async first(): Promise<InstanceType<Model>> {
        return this.model.$fromStorage(this.storage[0])
    }

    where<Attribute extends keyof ModelAttributes<InstanceType<Model>>>(attribute: Attribute, value: InstanceType<Model>[Attribute]) {
        return new (this.constructor as typeof RuntimeOpaqueQuery)(this.model, this.storage.filter(attributes => attributes[attribute] == value))
    }

    async get() {
        return this.storage.map(data => this.model.$fromStorage(data))
    }
}

export class RuntimeOpaqueAdapter<Model extends typeof OpaqueModel> implements OpaqueAdapter<Model> {
    storage: Map<IdType, ModelAttributes<InstanceType<Model>>> = new Map()

    constructor(public model: Model) {
    }

    async delete(id: IdType) {
        this.storage.delete(id)
    }

    async insert(data: ModelAttributes<InstanceType<Model>>) {
        const id = data[this.model.primaryKey as keyof ModelAttributes<InstanceType<Model>>] as IdType || v4()
        this.storage.set(id, { ...data, [this.model.primaryKey]: id })
        return id
    }

    async update(id: IdType, data: ModelAttributes<InstanceType<Model>>) {
        const previous = this.storage.get(id)
        for (const key in data) {
            (previous as any)[key] = (data as any)[key] as any
        }
    }

    async get(id: IdType) {
        return this.storage.get(id) || (() => { throw new Error(`Model "${this.model.name}" with id "${id} not found."`) })()
    }

    query() {
        return new RuntimeOpaqueQuery(this.model, [...this.storage.values()])
    }
}

export const runtime = <T extends Constructor<OpaqueModel> & { query(): any }>(base: T) => class RuntimeModel extends base {
    static $adapterConstructor = RuntimeOpaqueAdapter

    static query<Model extends typeof OpaqueModel>(this: Model) {
        return super.query() as RuntimeOpaqueQuery<Model>
    }
}