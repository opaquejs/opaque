import { QueryBuilderInterface } from "./QueryBuilderInterface";
import { AdapterInterface } from "./AdapterInterface";

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

export interface OpaqueRow {
  $schema: OpaqueSchema;
  $attributes: AttributeObjects;
  $primaryKeyValue: PrimaryKeyValue;

  $isPersistent: Boolean;
  $hasAttribute(name: string): Boolean;
  $getAttributes(pick: (keyof ModelAttributes<this>)[], options?: GetAttributeOptions): OpaqueAttributes;
  $getAttributes(options?: GetAttributeOptions): OpaqueAttributes;
  $getAttribute(name: keyof ModelAttributes<this>, options?: GetAttributeOptions): unknown;
  $setAttributes(data: Partial<ModelAttributes<this>>, options?: SetAttributeOptions): this;
  $setAttribute<Name extends keyof ModelAttributes<this>>(
    name: Name,
    value: ModelAttributes<this>[Name],
    options?: SetAttributeOptions
  ): this;

  reset(): this;
  reset(attributes: ReadonlyArray<keyof ModelAttributes<this>>): this;
  reset(...attributes: ReadonlyArray<keyof ModelAttributes<this>>): this;
  $resetAll(): this;
  $resetOnly(attributes: Iterable<string>): this;

  $setRow(data: OpaqueAttributes): this;

  save(): Promise<this>;
  save(attributes: ReadonlyArray<keyof ModelAttributes<this>>): Promise<this>;
  save(...attributes: ReadonlyArray<keyof ModelAttributes<this>>): Promise<this>;
  $saveAll(): Promise<this>;
  $saveOnly(attributes: ReadonlyArray<keyof ModelAttributes<this>>): Promise<this>;

  $setAndSaveAttributes(data: Partial<ModelAttributes<this>>): Promise<this>;

  delete(): Promise<void>;

  $serialize(): OpaqueAttributes;
  $serialize(pick: ReadonlyArray<keyof ModelAttributes<this>>): OpaqueAttributes;
  $serialize(pick: keyof ModelAttributes<this>): unknown;
  $serializeAll(): OpaqueAttributes;
  $serializeOnly(pick: ReadonlyArray<keyof ModelAttributes<this>>): OpaqueAttributes;
  $serializeAttribute(pick: keyof ModelAttributes<this>): unknown;
}

export interface AbstractOpaqueTable {
  new (): OpaqueRow;
  primaryKey: string;
  make<This extends AbstractOpaqueTable>(
    this: This,
    data?: Partial<ModelAttributes<InstanceType<This>>>
  ): InstanceType<This>;
  create<This extends AbstractOpaqueTable>(
    this: This,
    data?: Partial<ModelAttributes<InstanceType<This>>>
  ): Promise<InstanceType<This>>;
  find<This extends OpaqueTable & { query(): { first(): any } }>(
    this: This,
    key: PrimaryKeyValue
  ): Promise<InstanceType<This>>;

  $fromRow<This extends AbstractOpaqueTable>(this: This, data?: OpaqueAttributes): InstanceType<This>;
  $schema: Map<string, AttributeOptionsContract<unknown>>;
  $addAttribute<Type>(name: string, options?: Partial<AttributeOptionsContract<Type>>): void;
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
}

export interface OpaqueTable extends AbstractOpaqueTable {
  adapter: AdapterInterface<any>;
  query<This extends OpaqueTable>(this: This): QueryBuilderInterface<Parameters<This["adapter"]["read"]>[0], This>;
}
