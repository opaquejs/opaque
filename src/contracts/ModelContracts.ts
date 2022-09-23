import { Constructor } from "../util";
import { AdapterInterface } from "./AdapterInterface";
import { QueryBuilderContract, QueryBuilderInterface } from "./QueryBuilderContracts";

export type OpaqueSchema = Map<string, AttributeOptionsContract<any>>;

export type ModelAttributes<Model, ParentModel = OpaqueRow> = {
  [Filtered in {
    [P in keyof Model]: P extends string
      ? P extends keyof ParentModel
        ? never
        : Model[P] extends Function
        ? never
        : P extends number
        ? never
        : P extends symbol
        ? never
        : P
      : never;
  }[keyof Model]]: Model[Filtered];
};

export type OpaqueAttributes = Record<string, unknown>;

export interface AttributeOptionsContract<Type> {
  default: Type;
  get: (value: Type) => Type;
  set: (value: Type) => Type;
  serialize: (value: Type) => unknown;
  deserialize: (value: unknown) => Type;
  primaryKey: boolean;
}
export interface AttributeObjects {
  local: OpaqueAttributes;
  storage?: OpaqueAttributes;
}

export interface AccessAttributeOptions {
  raw?: boolean;
}
export interface GetAttributeOptions extends AccessAttributeOptions {}
export interface SetAttributeOptions extends AccessAttributeOptions {}

export type PrimaryKeyValue = string | number;

export interface OpaqueRowInterface {
  $schema: OpaqueSchema;
  $attributes: { chain: OpaqueAttributes };
  $primaryKeyValue: PrimaryKeyValue;

  $isPersistent: Boolean;
  $isDirty: Boolean;
  $hasAttribute(name: string): Boolean;
  $getAttributes(pick: string[], options?: GetAttributeOptions): OpaqueAttributes;
  $getAttributes(options?: GetAttributeOptions): OpaqueAttributes;
  $getAttribute(name: string, options?: GetAttributeOptions): unknown;
  $setAttributes(data: OpaqueAttributes, options?: SetAttributeOptions): this;
  $setAttribute(name: string, value: unknown, options?: SetAttributeOptions): this;

  reset(): this;
  reset(attributes: ReadonlyArray<string>): this;
  reset(...attributes: ReadonlyArray<string>): this;
  $resetAll(): this;
  $resetOnly(attributes: Iterable<string>): this;

  $setRow(data: OpaqueAttributes): this;

  save(): Promise<this>;
  save(attributes: ReadonlyArray<string>): Promise<this>;
  save(...attributes: ReadonlyArray<string>): Promise<this>;
  $saveAll(): Promise<this>;
  $saveOnly(attributes: ReadonlyArray<string>): Promise<this>;

  $setAndSaveAttributes(data: OpaqueAttributes): Promise<this>;

  delete(): Promise<void>;

  $serialize(): OpaqueAttributes;
  $serialize(pick: ReadonlyArray<string>): OpaqueAttributes;
  $serialize(pick: string): unknown;
  $serializeAll(): OpaqueAttributes;
  $serializeOnly(pick: ReadonlyArray<string>): OpaqueAttributes;
  $serializeAttribute(pick: string): unknown;

  // Relations
  $BelongsToRelationConstructor(): Constructor<BelongsToRelationInterface>;
  $HasManyRelationConstructor(): Constructor<HasManyRelationInterface>;
  belongsTo(model: OpaqueTable, options?: Partial<BelongsToRelationOptions>): BelongsToRelationInterface;
  hasMany(model: OpaqueTable, options?: Partial<HasManyRelationOptions>): HasManyRelationInterface;
}
export interface OpaqueRow extends OpaqueRowInterface {
  $getAttributes(pick: (keyof ModelAttributes<this>)[], options?: GetAttributeOptions): OpaqueAttributes;
  $getAttributes(options?: GetAttributeOptions): OpaqueAttributes;
  $getAttribute(name: keyof ModelAttributes<this>, options?: GetAttributeOptions): unknown;
  $setAttributes(data: Partial<ModelAttributes<this>>, options?: SetAttributeOptions): this;
  $setAttribute<Name extends keyof ModelAttributes<this>>(
    name: Name,
    value: ModelAttributes<this>[Name],
    options?: SetAttributeOptions
  ): this;

  reset(attributes: ReadonlyArray<keyof ModelAttributes<this>>): this;
  reset(...attributes: ReadonlyArray<keyof ModelAttributes<this>>): this;
  $resetOnly(attributes: Iterable<keyof ModelAttributes<this>>): this;

  save(attributes: ReadonlyArray<keyof ModelAttributes<this>>): Promise<this>;
  save(...attributes: ReadonlyArray<keyof ModelAttributes<this>>): Promise<this>;
  $saveOnly(attributes: ReadonlyArray<keyof ModelAttributes<this>>): Promise<this>;

  $setAndSaveAttributes(data: Partial<ModelAttributes<this>>): Promise<this>;

  $serialize(): OpaqueAttributes;
  $serialize(pick: ReadonlyArray<keyof ModelAttributes<this>>): OpaqueAttributes;
  $serialize(pick: keyof ModelAttributes<this>): unknown;
  $serializeAttribute(pick: keyof ModelAttributes<this>): unknown;

  // Relations
  belongsTo<Local extends OpaqueRow, Foreign extends OpaqueTable>(
    model: Foreign,
    options?: Partial<BelongsToRelationOptions>
  ): BelongsToRelationContract<Local, Foreign>;
  hasMany<Foreign extends OpaqueTable>(
    model: Foreign,
    options?: Partial<HasManyRelationOptions>
  ): HasManyRelationContract<Foreign>;
}

// Belongs to
export interface BelongsToRelationInterface {
  exec(): Promise<OpaqueRowInterface>;
  query(): QueryBuilderInterface;
  withDefault(resolver: () => OpaqueRowInterface): this;
  associate(model: OpaqueRowInterface): OpaqueRowInterface;
}
export interface BelongsToRelationStaticContract {
  new <Local extends OpaqueRow, Foreign extends OpaqueTable>(
    current: Local,
    foreign: Foreign
  ): BelongsToRelationContract<Local, Foreign>;
}
export interface BelongsToRelationContract<Local extends OpaqueRow, Foreign extends OpaqueTable>
  extends BelongsToRelationInterface {
  exec(): Promise<InstanceType<Foreign>>;
  query(): QueryBuilderContract<Foreign>;
  withDefault(resolver: () => InstanceType<Foreign>): this;
  associate(model: InstanceType<Foreign>): Local;
}

// Has many
export interface HasManyRelationInterface {
  exec(): Promise<OpaqueRowInterface[]>;
  make(attributes?: OpaqueAttributes): OpaqueRowInterface;
  create(attributes?: OpaqueAttributes): Promise<OpaqueRowInterface>;
}
export interface HasManyRelationStaticContract {
  new <Foreign extends OpaqueTable>(current: OpaqueRow, foreign: Foreign): HasManyRelationContract<Foreign>;
}
export interface HasManyRelationContract<Foreign extends OpaqueTable> extends HasManyRelationInterface {
  query(): QueryBuilderContract<Foreign>;
  exec(): Promise<InstanceType<Foreign>[]>;
  make(attributes?: Partial<ModelAttributes<InstanceType<Foreign>>>): InstanceType<Foreign>;
  create(attributes?: Partial<ModelAttributes<InstanceType<Foreign>>>): Promise<InstanceType<Foreign>>;
}
export interface HasManyRelationOptions {
  foreignKey: string;
  localKey: string;
}
export interface BelongsToRelationOptions {
  localKey: string;
}

export interface OpaqueTableInterface {
  new (): OpaqueRowInterface;
  adapter: AdapterInterface<any>;
  primaryKey: string;
  make(data?: OpaqueAttributes): OpaqueRowInterface;
  create(data?: OpaqueAttributes): Promise<OpaqueRowInterface>;
  find(key: PrimaryKeyValue): Promise<OpaqueRowInterface>;
  first(): Promise<OpaqueRowInterface>;
  findOrCreate(key: PrimaryKeyValue): Promise<OpaqueRowInterface>;

  $fromRow(data?: OpaqueAttributes): OpaqueRowInterface;
  $schema: Map<string, AttributeOptionsContract<unknown>>;
  $addAttribute<Type>(name: string, options?: Partial<AttributeOptionsContract<Type>>): void;
  $deserialize(data: OpaqueAttributes): OpaqueAttributes;
  $deserializeAttribute(key: keyof OpaqueAttributes, value: unknown): unknown;
  $serialize(data: OpaqueAttributes): OpaqueAttributes;
  $serializeAttribute(key: string, value: unknown): unknown;
  $QueryConstructor(): Constructor<QueryBuilderInterface>;
  query(): QueryBuilderInterface;
  all(): Promise<OpaqueRowInterface[]>;
}
export interface OpaqueTable {
  new (): OpaqueRow;
  adapter: AdapterInterface<any>;
  primaryKey: string;
  $schema: Map<string, AttributeOptionsContract<unknown>>;
  $addAttribute<Type>(name: string, options?: Partial<AttributeOptionsContract<Type>>): void;
  $QueryConstructor(): Constructor<QueryBuilderInterface>;
  make<This extends OpaqueTable>(this: This, data?: Partial<ModelAttributes<InstanceType<This>>>): InstanceType<This>;
  create<This extends OpaqueTable>(
    this: This,
    data?: Partial<ModelAttributes<InstanceType<This>>>
  ): Promise<InstanceType<This>>;
  find<This extends OpaqueTable>(this: This, key: PrimaryKeyValue): Promise<InstanceType<This>>;
  first<This extends OpaqueTable>(this: This): Promise<InstanceType<This>>;
  findOrCreate<This extends OpaqueTable>(this: This, key: PrimaryKeyValue): Promise<InstanceType<This>>;

  $fromRow<This extends OpaqueTable>(this: This, data?: OpaqueAttributes): InstanceType<This>;
  $deserialize<This extends OpaqueTable>(
    this: This,
    data: OpaqueAttributes
  ): Partial<ModelAttributes<InstanceType<This>>>;
  $deserializeAttribute<This extends OpaqueTable, Key extends keyof ModelAttributes<InstanceType<This>>>(
    this: This,
    key: Key,
    value: unknown
  ): ModelAttributes<InstanceType<This>>[Key];
  $serialize<This extends OpaqueTable>(
    this: This,
    data: Partial<ModelAttributes<InstanceType<This>>>
  ): OpaqueAttributes;
  $serializeAttribute<This extends OpaqueTable, Key extends keyof ModelAttributes<InstanceType<This>>>(
    this: This,
    key: Key,
    value: ModelAttributes<InstanceType<This>>[Key]
  ): unknown;
  query<This extends OpaqueTable>(this: This): QueryBuilderContract<This>;
  all<This extends OpaqueTable>(this: This): Promise<InstanceType<This>[]>;
}
