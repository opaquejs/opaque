import {
  HasManyRelationContract,
  HasManyRelationInterface,
  HasManyRelationStaticContract,
  OpaqueAttributes,
  OpaqueRowInterface,
  OpaqueTable,
  OpaqueTableInterface,
} from "../contracts/ModelContracts";
import { camelize } from "./inflector";
import { AbstractOpaqueImplementation } from "../Model";

export class HasManyRelationImplementation implements HasManyRelationInterface {
  constructor(public currentModel: OpaqueRowInterface, public model: OpaqueTableInterface) {}

  query() {
    return this.model
      .query()
      .where(camelize([this.currentModel.constructor.name, "id"]), "==", this.currentModel.$primaryKeyValue);
  }

  async exec() {
    return await this.query().get();
  }

  make(attributes?: OpaqueAttributes): OpaqueRowInterface {
    return this.model.make({
      ...attributes,
      [camelize([this.currentModel.constructor.name, "id"])]: this.currentModel.$primaryKeyValue,
    });
  }

  create(attributes?: OpaqueAttributes): Promise<OpaqueRowInterface> {
    return this.model.create({
      ...attributes,
      [camelize([this.currentModel.constructor.name, "id"])]: this.currentModel.$primaryKeyValue,
    });
  }

  save(model: AbstractOpaqueImplementation) {
    model.$setAttribute(camelize([this.currentModel.constructor.name, "id"]), this.currentModel.$primaryKeyValue);
    if (model.$isPersistent) {
      return model.$saveOnly([camelize([this.currentModel.constructor.name, "id"])]);
    } else {
      return model.save();
    }
  }
}

export const HasManyRelation: HasManyRelationStaticContract = HasManyRelationImplementation as any;
export type HasManyRelation<Foreign extends OpaqueTable> = HasManyRelationContract<Foreign>;
