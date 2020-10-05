import { OpaqueModel } from "./Model";

export interface OpaqueQuery<Model extends typeof OpaqueModel> {
    get(): Promise<Array<InstanceType<Model>>>
}