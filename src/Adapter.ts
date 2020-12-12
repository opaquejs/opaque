import { OpaqueModel } from "./Model";
import { IdType, ModelAttributes } from "./Contracts";
import { RootQuery } from "./QueryBuilder";

export interface OpaqueAdapter<Attributes extends object> {
    create(model: Attributes): Promise<Attributes>
    read(query: RootQuery<Attributes>): Promise<Attributes[]>
    update(query: RootQuery<Attributes>, data: Partial<Attributes>): Promise<void>
    delete(query: RootQuery<Attributes>): Promise<void>
}

export interface OpaqueAdapterConstructor<Attributes extends object> {
    new(model: Attributes): OpaqueAdapter<Attributes>
}

export class NoOpAdapter<Model extends object> implements OpaqueAdapter<Model> {
    async create(data: Model) {
        return data
    }
    async read(query: RootQuery<Model>) {
        return [] as Model[]
    }
    async delete(query: RootQuery<Model>) {

    }
    async update(query: RootQuery<Model>) {

    }
}