import { AdapterContract, OpaqueRow } from "./AdapterContracts";
import { OpaqueModel } from "../Model";
import { RootQuery, QueryBuilderContract } from "./QueryBuilderContracts";
import { QueryBuilder } from "../QueryBuilder";

export type OpaqueSchema = Map<string, AttributeOptionsContract<any>>

export type ModelAttributes<Model, ParentModel = OpaqueModel> = {
    [Filtered in {
        [P in keyof Model]: P extends string ? (P extends keyof ParentModel ? never : Model[P] extends Function ? never : P extends number ? never : P extends symbol ? never : P) : never;
    }[keyof Model]]: Model[Filtered];
}

export interface AttributeOptionsContract<Type> {
    default: Type,
    get: (value: Type) => Type
    set: (value: Type) => Type,
    serialize: (value: Type) => unknown
    deserialize: (value: unknown) => Type
    primaryKey: boolean,
}
export interface AttributeObjects {
    local: OpaqueRow,
    storage?: OpaqueRow
}

export interface AccessAttributeOptions {
    plain: boolean
}
export interface GetAttributeOptions extends AccessAttributeOptions { }
export interface SetAttributeOptions extends AccessAttributeOptions { }

export type IdType = string | number

export interface OpaqueModelContract {
    $adapter: AdapterContract
    $schema: OpaqueSchema
    $primaryKeyValue: any

    $isPersistent: Boolean
    $hasAttribute(name: string): Boolean
    $getAttributes(options: GetAttributeOptions): OpaqueRow
    $getAttribute(name: string, options: GetAttributeOptions): any
    $setAttributes(data: Partial<ModelAttributes<this>>, options: SetAttributeOptions): this
    $setAttribute<Name extends keyof ModelAttributes<this>>(name: Name, value: ModelAttributes<this>[Name], options: SetAttributeOptions): this

    $resetAll(): this
    $resetOnly(attributes: Iterable<keyof ModelAttributes<this>>): this

    $setRow(data: OpaqueRow): this

    $ownQuery: QueryBuilderContract<any>

    save(): Promise<this>
    $saveAll(): Promise<this>
    $saveOnly(attributes: Iterable<keyof ModelAttributes<this>>): Promise<this>

    $setAttributesAndSave(data: Partial<ModelAttributes<this>>): Promise<this>

    delete(): Promise<void>
}