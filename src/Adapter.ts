import { AdapterContract, OpaqueRow } from "./contracts/AdapterContracts";
import { RootQuery } from "./contracts/QueryBuilderContracts";

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