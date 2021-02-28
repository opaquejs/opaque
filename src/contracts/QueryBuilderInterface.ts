import { PrimaryKeyValue, OpaqueTable } from "./ModelContracts";

export interface QueryBuilderInterface<Query, Model extends OpaqueTable> {
  for(row: PrimaryKeyValue): this;
  $getQuery(): Query;
  first?(): Promise<InstanceType<Model>>;
}
