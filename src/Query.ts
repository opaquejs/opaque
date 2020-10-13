import { OpaqueModel } from "./Model";

export interface OpaqueQuery<Model extends typeof OpaqueModel> {
    fetch(): Promise<this>
    get(): Array<InstanceType<Model>>
    first(): InstanceType<Model> | undefined
    where(attribute: string, operator: any, value: any): this
}