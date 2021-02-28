import { OpaqueAttributes } from "./contracts/ModelContracts";
import { AdapterInterface } from "./contracts/AdapterInterface";

export class NoOpAdapter implements AdapterInterface<any> {
  async insert(data: OpaqueAttributes) {
    return data;
  }
  async read() {
    return [] as OpaqueAttributes[];
  }
  async delete() {}
  async update() {}
}
