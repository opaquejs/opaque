import { OpaqueModel } from "./Model";
import { OpaqueQuery } from "./Query";
import { IdType, ModelAttributes } from "./Contracts";

export interface OpaqueAdapter<Model extends typeof OpaqueModel> {
    delete(id: IdType): Promise<void>
    insert(data: ModelAttributes<InstanceType<Model>>): Promise<IdType>
    update(id: IdType, data: Partial<ModelAttributes<InstanceType<Model>>>): Promise<void>
    get(id: IdType): Promise<ModelAttributes<InstanceType<Model>>>
    query(): OpaqueQuery<Model>
}

export interface OpaqueAdapterConstructor<Model extends typeof OpaqueModel> {
    new(model: Model): OpaqueAdapter<Model>
}