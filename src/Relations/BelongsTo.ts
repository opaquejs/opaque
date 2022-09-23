import {
  BelongsToRelationContract,
  BelongsToRelationInterface,
  BelongsToRelationOptions,
  BelongsToRelationStaticContract,
  OpaqueRow,
  OpaqueRowInterface,
  OpaqueTable,
  OpaqueTableInterface,
} from "../contracts/ModelContracts";
import { camelize } from "./inflector";

export class BelongsToRelationImplementation implements BelongsToRelationInterface {
  public default: () => OpaqueRow | undefined = () => undefined;
  constructor(
    public currentModel: OpaqueRowInterface,
    public model: OpaqueTableInterface,
    public options: Partial<BelongsToRelationOptions> = {}
  ) {}

  protected resolveOption<K extends keyof BelongsToRelationOptions>(key: K): BelongsToRelationOptions[K] {
    const defaultOptions: {
      [key in keyof BelongsToRelationOptions]: () => BelongsToRelationOptions[key];
    } = {
      localKey: () => camelize([this.currentModel.constructor.name, "id"]),
    };
    return (this.options[key] || defaultOptions[key]()) as BelongsToRelationOptions[K];
  }

  withDefault(default_model: () => OpaqueRow) {
    this.default = default_model;
    return this;
  }

  associate(model: OpaqueRowInterface) {
    this.currentModel.$setAttribute(this.resolveOption("localKey"), model.$primaryKeyValue);
    return this.currentModel;
  }

  query() {
    return this.model.query().for(this.currentModel.$getAttribute(this.resolveOption("localKey")));
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
