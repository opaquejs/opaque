import { IdType, ModelAttributes } from "./Contracts"
import { OpaqueModel } from "./Model"
import { OpaqueAdapter } from "./Adapter"
import { v4 } from "uuid"
import { Constructor } from "./util"
import { RootQuery, queryCollection } from "./QueryBuilder"

export class RuntimeOpaqueAdapter<Model extends typeof OpaqueModel> implements OpaqueAdapter<Model> {
    storage: Map<IdType, ModelAttributes<InstanceType<Model>>> = new Map()

    constructor(public model: Model) {
    }

    async delete(query: RootQuery<ModelAttributes<InstanceType<Model>>>) {
        for (const { [this.model.primaryKey as keyof ModelAttributes<InstanceType<Model>>]: id } of queryCollection([...this.storage.values()], query)) {
            this.storage.delete(id as IdType)
        }
    }

    async create(data: ModelAttributes<InstanceType<Model>>) {
        const obj = { ...data } as any
        if (obj[this.model.primaryKey] === undefined) {
            obj[this.model.primaryKey] = v4()
        }
        this.storage.set(obj[this.model.primaryKey], obj)
        return obj
    }

    async update(query: RootQuery<ModelAttributes<InstanceType<Model>>>, data: ModelAttributes<InstanceType<Model>>) {
        for (const { [this.model.primaryKey as keyof ModelAttributes<InstanceType<Model>>]: id } of await this.read(query)) {
            const previous = this.storage.get(id as IdType)
            for (const key in data) {
                (previous as any)[key] = (data as any)[key] as any
            }
        }
    }

    async read(query: RootQuery<ModelAttributes<InstanceType<Model>>>) {
        return queryCollection([...this.storage.values()], query)
    }
}

export const runtime = <T extends Constructor<OpaqueModel>>(base: T) => class RuntimeModel extends base {
    static $adapterConstructor = RuntimeOpaqueAdapter
}