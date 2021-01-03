import { OpaqueModel } from "./Model"
import { OpaqueRow } from "./Adapter"

export type ModelAttributes<Model extends ParentModel, ParentModel = OpaqueModel> = {
    [Filtered in {
        [P in keyof Model]: P extends keyof ParentModel ? never : Model[P] extends Function ? never : P extends number ? never : P extends symbol ? never : P;
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

// export type AttributeMap<Model extends ParentModel, ParentModel = OpaqueModel> = Map<keyof ModelAttributes<Model, ParentModel>, unknown>

export interface AttributeObjects<Model extends ParentModel, ParentModel = OpaqueModel> {
    local: OpaqueRow,
    storage?: OpaqueRow
}
// export interface AttributeMaps<Model extends ParentModel, ParentModel = OpaqueModel> {
//     local: AttributeMap<Model, ParentModel>,
//     storage?: AttributeMap<Model, ParentModel>
// }

export interface AccessAttributeOptions {
    plain: boolean
}
export interface GetAttributeOptions extends AccessAttributeOptions { }
export interface SetAttributeOptions extends AccessAttributeOptions { }

export type IdType = string | number