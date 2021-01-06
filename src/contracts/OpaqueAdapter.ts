import { RootQuery } from "../QueryBuilder";

export type OpaqueRow = Record<string, unknown>

export interface AdapterContract {
    create(model: OpaqueRow): Promise<OpaqueRow>
    read(query: RootQuery<OpaqueRow>): Promise<OpaqueRow[]>
    update(query: RootQuery<OpaqueRow>, data: OpaqueRow): Promise<OpaqueRow[]>
    delete(query: RootQuery<OpaqueRow>): Promise<void>
}

export interface SyncReadAdapterContract {
    readSync(query: RootQuery<OpaqueRow>): OpaqueRow[]
}
export interface SyncWriteAdapterContract {
    createSync(model: OpaqueRow): OpaqueRow
    updateSync(query: RootQuery<OpaqueRow>, data: OpaqueRow): OpaqueRow[]
    deleteSync(query: RootQuery<OpaqueRow>): void
}
export interface SyncAdapterContract extends SyncReadAdapterContract, SyncWriteAdapterContract {

}
