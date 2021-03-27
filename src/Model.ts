import { getInheritedPropertyDescriptor } from "./util";
import {
  OpaqueSchema,
  AttributeOptionsContract,
  ModelAttributes,
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
  static async create<This extends AbstractOpaqueTable>(this: This, data?: object) {
    return this.make(data).save();
  }

  static $fromRow<This extends AbstractOpaqueTable>(this: This, data: OpaqueAttributes) {
    const model = new this() as InstanceType<This>;
    model.$setRow(data);
    model.$resetAll();
    return model;
  }

  static async find<This extends OpaqueTable>(this: This, key: PrimaryKeyValue) {
    return (await this.query().for(key).first!()) as InstanceType<This>;
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

  $attributes: { chain: OpaqueAttributes } = {
    chain: Object.create(null),
  };

  get $isPersistent() {
    return Object.getPrototypeOf(this.$attributes.chain) != null;
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

    value = this.$attributes.chain[attribute];
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
    this.$attributes.chain[attribute] = value;
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
    return this.$resetOnly(Object.getOwnPropertyNames(this.$attributes.chain));
  }
  $resetOnly(attributes: ReadonlyArray<string>) {
    for (const key of attributes) {
      if (this.$isPersistent) {
        delete this.$attributes.chain[key];
      } else {
        this.$attributes.chain[key] = this.$schema.get(key)!.default;
      }
    }
    return this;
  }

  $setRow(data: OpaqueAttributes) {
    Object.setPrototypeOf(this.$attributes.chain, (this.constructor as OpaqueTable).$deserialize(data));
    // this.$attributes.persistent = true;
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
    const isPersistent = this.$isPersistent;
    // Isolate state to avoid race condition,
    // when data is written after read, but before reset
    // and blank data while saving when using reactive Update
    const staging: OpaqueAttributes = Object.create(Object.getPrototypeOf(this.$attributes.chain));
    Object.assign(staging, this.$getAttributes(attributes, { raw: true }));
    this.$setRow(staging);
    // this.$attributes.chain.__proto__ = staging;
    this.$resetOnly(attributes);
    // Chain is now current -> staging -> storage

    const stagingSerialized = this.$serialize(attributes);

    const adapter = (this.constructor as OpaqueTable).adapter;
    if (isPersistent) {
      await adapter.update(this.$ownQuery.$getQuery(), stagingSerialized);
    } else {
      const result = await adapter.insert(stagingSerialized);
      if (typeof result == "object") {
        this.$setRow(result);
      } else {
        staging[(this.constructor as OpaqueTable).primaryKey] = result;
      }
    }
    return this;
  }

  $saveAll() {
    return this.$saveOnly(Object.getOwnPropertyNames(this.$attributes.chain));
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
