import { OpaqueModel } from "./Model";
import { IdType, ModelAttributes } from "./Contracts";
import { RootQuery } from "./QueryBuilder";

export interface OpaqueAdapter<Model extends typeof OpaqueModel> {
    create(model: ModelAttributes<InstanceType<Model>>): Promise<ModelAttributes<InstanceType<Model>>>
    read(query: RootQuery<ModelAttributes<InstanceType<Model>>>): Promise<ModelAttributes<InstanceType<Model>>[]>
    update(query: RootQuery<ModelAttributes<InstanceType<Model>>>, data: Partial<ModelAttributes<InstanceType<Model>>>): Promise<void>
    delete(query: RootQuery<ModelAttributes<InstanceType<Model>>>): Promise<void>
}

export interface OpaqueAdapterConstructor<Model extends typeof OpaqueModel> {
    new(model: Model): OpaqueAdapter<Model>
}