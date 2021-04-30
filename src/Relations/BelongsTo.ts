import {
  BelongsToRelationContract,
  BelongsToRelationInterface,
  BelongsToRelationStaticContract,
  OpaqueRow,
  OpaqueRowInterface,
  OpaqueTable,
  OpaqueTableInterface,
} from "../contracts/ModelContracts";
import { camelize } from "./inflector";

export class BelongsToRelationImplementation implements BelongsToRelationInterface {
  public default: () => OpaqueRow | undefined = () => undefined;
  constructor(public currentModel: OpaqueRowInterface, public model: OpaqueTableInterface) {}

  withDefault(default_model: () => OpaqueRow) {
    this.default = default_model;
    return this;
  }

  associate(model: OpaqueRowInterface) {
    this.currentModel.$setAttribute(camelize([this.model.name, "id"]), model.$primaryKeyValue);
    return this.currentModel;
  }

  query() {
    return this.model.query().for(this.currentModel.$getAttribute(camelize([this.model.name, "id"])));
  }

  async exec() {
    return (await this.query().first()) || this.default();
  }
}

export const BelongsToRelation: BelongsToRelationStaticContract = BelongsToRelationImplementation as any;
export type BelongsToRelation<Local extends OpaqueRow, Foreign extends OpaqueTable> = BelongsToRelationContract<
  Local,
  Foreign
>;
