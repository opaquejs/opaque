import { OpaqueAttributes, PrimaryKeyValue } from "./ModelContracts";

export interface AdapterInterface<T> {
  insert(data: OpaqueAttributes): Promise<PrimaryKeyValue | OpaqueAttributes>;
  update(query: T, data: OpaqueAttributes): Promise<void>;
  delete(query: T): Promise<void>;
  read(query: T): Promise<OpaqueAttributes[]>;
}
