import { NormalizedQuery } from "@opaquejs/query";
import { OpaqueAttributes, OpaqueTableInterface, PrimaryKeyValue } from "./ModelContracts";

export interface AdapterInterface<T = NormalizedQuery> {
  insert(model: OpaqueTableInterface, data: OpaqueAttributes): Promise<PrimaryKeyValue | OpaqueAttributes>;
  update(model: OpaqueTableInterface, query: T, data: OpaqueAttributes): Promise<void>;
  delete(model: OpaqueTableInterface, query: T): Promise<void>;
  read(model: OpaqueTableInterface, query: T): Promise<OpaqueAttributes[]>;
}
