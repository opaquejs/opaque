import { OpaqueModelContract, ModelAttributes } from "./OpaqueModel";

export type ReverseComparisonTypes<Value> = {
    '==': Value,
    '!=': Value,
    '<': Value,
    '>': Value,
    '<=': Value,
    '>=': Value,
    'in': Value[],
}

export type ComparisonTypes<Value> = {
    [C in keyof typeof Comparison]: ReverseComparisonTypes<Value>[(typeof Comparison)[C]]
}

export enum Comparison {
    _eq = '==',
    _ne = '!=',
    _lt = '<',
    _gt = '>',
    _lte = '<=',
    _gte = '>=',
    _in = 'in'
}

export interface QueryBuilderContract<Model extends OpaqueModelContract> {
    where<Attributes extends ModelAttributes<Model>, Attribute extends keyof Attributes, Key extends keyof ReverseComparisonTypes<Attributes[Attribute]>>(attribute: Attribute, operator: Key, value: ReverseComparisonTypes<Attributes[Attribute]>[Key]): this
    limit(limit: number): this
    skip(skip: number): this
    get(): Promise<Iterable<OpaqueModelContract>>
    update(data: Partial<ModelAttributes<Model>>): Promise<Iterable<OpaqueModelContract>>
    delete(): Promise<void>
}