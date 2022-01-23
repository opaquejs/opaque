import { OpaqueAttributes, OpaqueTableInterface } from "./contracts/ModelContracts";
import { AdapterInterface } from "./contracts/AdapterInterface";

export class NoOpAdapter implements AdapterInterface<any> {
  async insert(model: OpaqueTableInterface, data: OpaqueAttributes) {
    return data;
  }
  async read() {
    return [] as OpaqueAttributes[];
  }
  async delete() {}
  async update() {}
}
