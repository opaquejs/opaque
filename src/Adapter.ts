import { RootQuery } from "./QueryBuilder";

export type OpaqueRow = Record<string, unknown>

export interface AdapterContract {
    create(model: OpaqueRow): Promise<OpaqueRow>
    read(query: RootQuery<OpaqueRow>): Promise<OpaqueRow[]>
    update(query: RootQuery<OpaqueRow>, data: OpaqueRow): Promise<OpaqueRow[]>
    delete(query: RootQuery<OpaqueRow>): Promise<void>
}

export class NoOpAdapter implements AdapterContract {

    async create(data: OpaqueRow) {
        return data
    }
    async read(query: RootQuery<OpaqueRow>) {
        return [] as OpaqueRow[]
    }
    async delete(query: RootQuery<OpaqueRow>) {

    }
    async update(query: RootQuery<OpaqueRow>) {
        return []
    }
}