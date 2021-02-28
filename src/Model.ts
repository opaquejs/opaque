import { getInheritedPropertyDescriptor } from "./util";
import {
  OpaqueSchema,
  AttributeOptionsContract,
  ModelAttributes,
  AttributeObjects,
  GetAttributeOptions,
  SetAttributeOptions,
  OpaqueTable,
  OpaqueRow,
  PrimaryKeyValue,
  OpaqueAttributes,
  AbstractOpaqueTable,
} from "./contracts/ModelContracts";

export const attribute = <Type>(options: Partial<AttributeOptionsContract<Type> & { default: never }> = {}) => <
  M extends OpaqueRow
>(
  model: M,
  property: string
) => {
  const constructor = model.constructor as AbstractOpaqueTable;
  constructor.$addAttribute(property, {
    ...options,
    default: ((new constructor() as unknown) as Record<string, unknown>)[property] as Type,
  });
};

export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor;
  };
}

@staticImplements<AbstractOpaqueTable>()
export class AbstractOpaqueImplementation implements OpaqueRow {
  static $inheritedSchemas: Map<typeof AbstractOpaqueImplementation, OpaqueSchema> = new Map();

  static get primaryKey() {
    const primaryKeyFields = Array.from(this.$schema.entries()).filter(([_key, options]) => options.primaryKey);
    const primaryKeyField = primaryKeyFields[primaryKeyFields.length - 1];
    if (!Array.isArray(primaryKeyField)) {
      throw new Error(`No primary key was found for the model "${this.name}"!`);
    }
    return primaryKeyField[0];
  }

  static get $schema() {
    const finalSchema: OpaqueSchema = new Map();
    for (const [model, schema] of this.$inheritedSchemas) {
      if (this.prototype instanceof model || this === model) {
        for (const entry of schema) {
          finalSchema.set(...entry);
        }
      }
    }
    return finalSchema;
  }

  static $addAttribute<Type>(name: string, options: Partial<AttributeOptionsContract<any>> = {}) {
    if (!this.$inheritedSchemas.has(this)) {
      this.$inheritedSchemas.set(this, new Map());
    }
    this.$inheritedSchemas.get(this)!.set(name, {
      default: undefined,
      get: (value: Type) => value,
      set: (value: Type) => value,
      serialize: (value) => value,
      deserialize: (value) => value,
      primaryKey: false,
      ...options,
    });
  }

  static make<This extends AbstractOpaqueTable>(this: This, data?: OpaqueAttributes) {
    const instance = new this() as InstanceType<This>;
    if (data) {
      (instance as AbstractOpaqueImplementation).$setAttributes(data);
    }
    return instance;
  }

  static $fromRow<This extends AbstractOpaqueTable>(this: This, data: OpaqueAttributes) {
    const model = new this() as InstanceType<This>;
    model.$setRow(data);
    model.$resetAll();
    return model;
  }

  static find<This extends OpaqueTable>(this: This, key: PrimaryKeyValue) {
    return this.query().for(key).first!();
  }

  static $serializeAttribute(key: string, value: unknown) {
    const attribute = this.$schema.get(key);
    return attribute ? attribute.serialize(value) : value;
  }
  static $serialize(data: OpaqueAttributes) {
    return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, this.$serializeAttribute(key, value)]));
  }

  static $deserializeAttribute(key: string, value: unknown) {
    const attribute = this.$schema.get(key);
    return attribute ? attribute.deserialize(value) : value;
  }
  static $deserialize(data: OpaqueAttributes) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, this.$deserializeAttribute(key, value)])
    ) as any;
  }

  constructor() {
    const schema = (this.constructor as OpaqueTable).$schema;
    for (const attribute of schema.keys()) {
      Object.defineProperty(this, attribute, {
        get: getInheritedPropertyDescriptor(this, attribute)?.get || (() => this.$getAttribute(attribute)),
        set:
          getInheritedPropertyDescriptor(this, attribute)?.set ||
          ((value: unknown) => this.$setAttribute(attribute, value)),
      });
      if (schema.get(attribute)!.default !== undefined) {
        this.$setAttribute(attribute, schema.get(attribute)!.default);
      }
    }
  }

  $attributes: AttributeObjects = {
    local: {},
  };

  get $isPersistent() {
    return this.$attributes.storage instanceof Object;
  }
  get $schema() {
    return (this.constructor as OpaqueTable).$schema;
  }

  get $primaryKeyValue() {
    return this.$getAttribute((this.constructor as OpaqueTable).primaryKey) as PrimaryKeyValue;
  }

  set $primaryKeyValue(value: PrimaryKeyValue) {
    this.$setAttribute((this.constructor as OpaqueTable).primaryKey, value);
  }

  $getAttributes(pickOrOptions?: readonly string[] | GetAttributeOptions, optionsIfPick?: GetAttributeOptions) {
    const pick = Array.isArray(pickOrOptions)
      ? pickOrOptions
      : Array.from((this.constructor as OpaqueTable).$schema.keys());
    const options = Array.isArray(pickOrOptions) ? optionsIfPick : (pickOrOptions as GetAttributeOptions | undefined);

    const attributes: Record<string, unknown> = {};
    for (const attribute of pick) {
      attributes[attribute] = this.$getAttribute(attribute as keyof ModelAttributes<this>, options);
    }
    return attributes;
  }

  $hasAttribute(attribute: string): boolean {
    return (this.constructor as OpaqueTable).$schema.has(attribute);
  }

  $getAttribute(attribute: string, options: Partial<GetAttributeOptions> = {}) {
    let value: unknown;

    if (!this.$hasAttribute(attribute)) {
      throw new Error(`The requested attribute '${attribute}' does not exist on the model '${this.constructor.name}'!`);
    }

    if (attribute in this.$attributes.local) {
      value = this.$attributes.local[attribute];
    } else {
      value = this.$attributes.storage![attribute];
    }
    if (!options.raw) {
      value = (this.constructor as OpaqueTable).$schema.get(attribute)!.get(value);
    }
    return value;
  }

  $setAttribute(attribute: string, value: unknown, options: SetAttributeOptions = {}) {
    if (!this.$hasAttribute(attribute)) {
      throw new Error(`The requested attribute '${attribute}' does not exist on the model '${this.constructor.name}'!`);
    }
    if (!options.raw) {
      value = (this.constructor as OpaqueTable).$schema.get(attribute)!.set(value);
    }
    this.$attributes.local[attribute] = value;
    return this;
  }

  $setAttributes(attributes: OpaqueAttributes, options?: Partial<SetAttributeOptions>) {
    for (const key in attributes) {
      this.$setAttribute(key, attributes[key], options);
    }
    return this;
  }

  reset(...attributes: ReadonlyArray<keyof ModelAttributes<this>> | [ReadonlyArray<keyof ModelAttributes<this>>]) {
    if (attributes.length == 0) {
      return this.$resetAll();
    }
    return this.$resetOnly(Array.isArray(attributes[0]) ? attributes[0] : attributes);
  }

  $resetAll() {
    return this.$resetOnly(Object.keys(this.$attributes.local));
  }
  $resetOnly(attributes: ReadonlyArray<string>) {
    for (const key of attributes) {
      if (this.$isPersistent) {
        delete this.$attributes.local[key];
      } else {
        this.$attributes.local[key] = this.$schema.get(key)!.default;
      }
    }
    return this;
  }

  $setRow(data: OpaqueAttributes) {
    this.$attributes.storage = (this.constructor as OpaqueTable).$deserialize(data);
    return this;
  }

  get $ownQuery() {
    return (this.constructor as OpaqueTable).query().for(this.$primaryKeyValue);
  }

  save(...attributes: readonly string[] | readonly [readonly string[]]) {
    if (attributes.length == 0) {
      return this.$saveAll();
    }
    if (Array.isArray(attributes[0])) {
      return this.$saveOnly(attributes[0]);
    }
    return this.$saveOnly(attributes as string[]);
  }

  async delete() {
    await (this.constructor as OpaqueTable).adapter!.delete(this.$ownQuery.$getQuery());
  }

  async $saveOnly(attributes: ReadonlyArray<string>) {
    const toInsert = this.$serialize(attributes);
    // Reset before save to avoid race condition,
    // when data is written after read, but before reset
    this.$resetOnly(attributes);
    const adapter = (this.constructor as OpaqueTable).adapter;
    if (this.$isPersistent) {
      await adapter.update(this.$ownQuery.$getQuery(), toInsert);
    } else {
      const result = await adapter.insert(toInsert);
      if (typeof result == "object") {
        this.$setRow(result);
      } else {
        this.$primaryKeyValue = result;
      }
    }
    return this;
  }

  $saveAll() {
    return this.$saveOnly(Object.keys(this.$attributes.local));
  }

  async $setAndSaveAttributes(attributes: Partial<ModelAttributes<this>>) {
    this.$setAttributes(attributes);
    await this.$saveOnly(Object.keys(attributes));
    return this;
  }

  $serialize(_one?: string | ReadonlyArray<string>) {
    const pick = Array.isArray(_one) ? _one : _one == undefined ? _one : [_one];

    const attributes = pick ? this.$getAttributes(pick, { raw: true }) : this.$getAttributes({ raw: true });

    return (this.constructor as OpaqueTable).$serialize(attributes);
  }
  $serializeAll() {
    return (this.constructor as OpaqueTable).$serialize(this.$getAttributes({ raw: true }));
  }
  $serializeOnly(pick: ReadonlyArray<string>) {
    return (this.constructor as OpaqueTable).$serialize(this.$getAttributes(pick, { raw: true }));
  }
  $serializeAttribute(pick: string) {
    return (this.constructor as typeof AbstractOpaqueImplementation).$serializeAttribute(
      pick,
      this.$getAttribute(pick, { raw: true })
    );
  }
}

export type OpaqueModel = AbstractOpaqueImplementation;
export const OpaqueModel = AbstractOpaqueImplementation as AbstractOpaqueTable;
