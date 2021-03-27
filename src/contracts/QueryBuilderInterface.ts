import { PrimaryKeyValue, OpaqueRow } from "./ModelContracts";

export interface QueryBuilderInterface<Query> {
  for(row: PrimaryKeyValue): this;
  $getQuery(): Query;
  first?(): Promise<OpaqueRow>;
}
