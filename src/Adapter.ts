import { RootQuery } from "./QueryBuilder";
import { AdapterContract, OpaqueRow } from "./contracts/OpaqueAdapter";

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