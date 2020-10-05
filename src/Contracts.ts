import { OpaqueModel } from "./Model"

export type ModelAttributes<Model extends ParentModel, ParentModel = OpaqueModel> = {
    [Filtered in {
        [P in keyof Model]: P extends keyof ParentModel ? never : Model[P] extends Function ? never : P extends number ? never : P extends symbol ? never : P;
    }[keyof Model]]: Model[Filtered];
}

export interface AttributeOptions<Type> {
    default: Type,
    get: (value: Type) => Type
    set: (value: Type) => Type,
    primaryKey: boolean,
}

// export type AttributeMap<Model extends ParentModel, ParentModel = OpaqueModel> = Map<keyof ModelAttributes<Model, ParentModel>, unknown>

export interface AttributeObjects<Model extends ParentModel, ParentModel = OpaqueModel> {
    local: Partial<ModelAttributes<Model, ParentModel>>,
    storage?: ModelAttributes<Model, ParentModel>
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