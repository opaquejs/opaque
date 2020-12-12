import { RootQuery } from "./QueryBuilder";
import { OpaqueModel } from "./Model";
import { ModelAttributes } from "./Contracts";

export interface OpaqueAdapter<Model extends typeof OpaqueModel> {
    create(model: ModelAttributes<InstanceType<Model>>): Promise<ModelAttributes<InstanceType<Model>>>
    read(query: RootQuery<ModelAttributes<InstanceType<Model>>>): Promise<ModelAttributes<InstanceType<Model>>[]>
    update(query: RootQuery<ModelAttributes<InstanceType<Model>>>, data: Partial<ModelAttributes<InstanceType<Model>>>): Promise<void>
    delete(query: RootQuery<ModelAttributes<InstanceType<Model>>>): Promise<void>
}

export interface OpaqueAdapterConstructor<Model extends typeof OpaqueModel> {
    new(model: Model): OpaqueAdapter<Model>
}

export class NoOpAdapter<Model extends typeof OpaqueModel> implements OpaqueAdapter<Model> {
    async create(data: ModelAttributes<InstanceType<Model>>) {
        return data
    }
    async read(query: RootQuery<ModelAttributes<InstanceType<Model>>>) {
        return [] as ModelAttributes<InstanceType<Model>>[]
    }
    async delete(query: RootQuery<ModelAttributes<InstanceType<Model>>>) {

    }
    async update(query: RootQuery<ModelAttributes<InstanceType<Model>>>) {

    }
}