import {
  HasManyRelationContract,
  HasManyRelationInterface,
  HasManyRelationStaticContract,
  OpaqueAttributes,
  OpaqueRowInterface,
  OpaqueTable,
  OpaqueTableInterface,
  HasManyRelationOptions,
} from "../contracts/ModelContracts";
import { camelize } from "./inflector";
import { AbstractOpaqueImplementation } from "../Model";

export class HasManyRelationImplementation implements HasManyRelationInterface {
  constructor(
    public currentModel: OpaqueRowInterface,
    public model: OpaqueTableInterface,
    public options: Partial<HasManyRelationOptions> = {}
  ) {}

  protected resolveOption<K extends keyof HasManyRelationOptions>(key: K): HasManyRelationOptions[K] {
    const defaultOptions: {
      [key in keyof HasManyRelationOptions]: () => HasManyRelationOptions[key];
    } = {
      foreignKey: () => camelize([this.currentModel.constructor.name, "id"]),
      localKey: () => (this.currentModel.constructor as OpaqueTableInterface).primaryKey,
    };
    return (this.options[key] || defaultOptions[key]()) as HasManyRelationOptions[K];
  }

  query() {
    return this.model
      .query()
      .where(this.resolveOption("foreignKey"), "==", this.currentModel.$getAttribute(this.resolveOption("localKey")));
  }

  async exec() {
    return await this.query().get();
  }

  make(attributes?: OpaqueAttributes): OpaqueRowInterface {
    return this.model.make({
      ...attributes,
      [this.resolveOption("foreignKey")]: this.currentModel.$getAttribute(this.resolveOption("localKey")),
    });
  }

  create(attributes?: OpaqueAttributes): Promise<OpaqueRowInterface> {
    return this.model.create({
      ...attributes,
      [this.resolveOption("foreignKey")]: this.currentModel.$getAttribute(this.resolveOption("localKey")),
    });
  }

  save(model: AbstractOpaqueImplementation) {
    model.$setAttribute(
      this.resolveOption("foreignKey"),
      this.currentModel.$getAttribute(this.resolveOption("localKey"))
    );
    if (model.$isPersistent) {
      return model.$saveOnly([this.resolveOption("foreignKey")]);
    } else {
      return model.save();
    }
  }
}

export const HasManyRelation: HasManyRelationStaticContract = HasManyRelationImplementation as any;
export type HasManyRelation<Foreign extends OpaqueTable> = HasManyRelationContract<Foreign>;
