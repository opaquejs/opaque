import { OpaqueModel } from "./Model";

export interface OpaqueQuery<Model extends OpaqueModel> {
    fetch(): Promise<this>
    get(): Array<Model>
    first(): Model | undefined
    where(attribute: string, operator: any, value: any): this
}