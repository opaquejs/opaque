import { getInheritedPropertyDescriptor } from "./util"
import { AttributeOptions, AttributeObjects, ModelAttributes, GetAttributeOptions, SetAttributeOptions } from "./Contracts"
import { OpaqueAdapter } from "./Adapter"
import QueryBuilder, { Comparison, RootQuery, Query } from "./QueryBuilder"

export const attribute = <Type>(options: Partial<AttributeOptions<Type> & { default: never }> = {}) => <M extends OpaqueModel>(model: M, property: string) => {
    const constructor = model.constructor as (new () => OpaqueModel) & typeof OpaqueModel
    constructor.boot()
    constructor.$addAttribute(property, {
        ...options,
        default: (new constructor() as any)[property]
    })
}

export class OpaqueModel {
    static $schema: Map<string, AttributeOptions<any>>
    static $adapterConstructor: new (model: typeof OpaqueModel) => OpaqueAdapter<any>
    static $adapter: OpaqueAdapter<any>
    static booted: boolean
    static primaryKey: string

    $attributes: AttributeObjects<this> = {
        local: {}
    }

    static boot(): void {
        if (this.booted) {
            return
        }
        if (!this.$adapterConstructor) {
            throw new Error('You need to use an adapter in order to boot the model "' + this.name + '"!')
        }
        this.booted = true

        this.primaryKey = this.primaryKey || 'id'

        Object.defineProperty(this, '$schema', { value: new Map() })
        Object.defineProperty(this, '$adapter', { value: new this.$adapterConstructor(this) })
    }

    static $addAttribute<Type>(name: string, options: Partial<AttributeOptions<Type>> = {}): void {
        this.$schema.set(name, {
            default: undefined,
            get: (value: Type) => value,
            set: (value: Type) => value,
            serialize: value => value,
            deserialize: value => value,
            primaryKey: false,
            ...options
        })
        if (options.primaryKey) {
            this.primaryKey = name
        }
    }

    static $fromStorage<Model extends (new () => OpaqueModel) & typeof OpaqueModel>(this: Model, data: Record<keyof ModelAttributes<InstanceType<Model>>, any>) {
        const model = new this() as InstanceType<Model>
        model.$setStorage(data)
        model.$resetAll()
        return model
    }

    static query<Model extends (new () => OpaqueModel) & typeof OpaqueModel>(this: Model) {
        return new QueryBuilder(this)
    }

    static async find<Model extends (new () => OpaqueModel) & typeof OpaqueModel>(this: Model, key: Model["primaryKey"]) {
        return await this.query().where(this.primaryKey as any, Comparison._eq, key).first()
    }

    static $serializeAttribute<Model extends (new () => OpaqueModel) & typeof OpaqueModel, Key extends keyof ModelAttributes<InstanceType<Model>>>(this: Model, key: Key, value: ModelAttributes<InstanceType<Model>>[Key]) {
        const attribute = this.$schema.get(key)
        return attribute ? attribute.serialize(value) : value
    }
    static $serialize<Model extends (new () => OpaqueModel) & typeof OpaqueModel>(this: Model, data: Partial<ModelAttributes<InstanceType<Model>>>) {
        return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, this.$serializeAttribute(key as keyof ModelAttributes<InstanceType<Model>>, value as ModelAttributes<InstanceType<Model>>[any])])) as Record<keyof Partial<ModelAttributes<InstanceType<Model>>>, unknown>
    }

    static $deserializeAttribute<Model extends (new () => OpaqueModel) & typeof OpaqueModel, Key extends keyof ModelAttributes<InstanceType<Model>>>(this: Model, key: Key, value: unknown) {
        const attribute = this.$schema.get(key)
        return attribute ? attribute.deserialize(value) : value
    }
    static $deserialize<Model extends (new () => OpaqueModel) & typeof OpaqueModel>(this: Model, data: Record<keyof ModelAttributes<InstanceType<Model>>, unknown>) {
        return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, this.$deserializeAttribute(key as keyof ModelAttributes<InstanceType<Model>>, value as ModelAttributes<InstanceType<Model>>[any])])) as Record<keyof Partial<ModelAttributes<InstanceType<Model>>>, unknown>
    }

    constructor() {
        const schema = (this.constructor as typeof OpaqueModel).$schema
        for (const attribute of schema.keys()) {
            Object.defineProperty(this, attribute, {
                get: getInheritedPropertyDescriptor(this, attribute)?.get || (() => this.$getAttribute(attribute as any)) as any,
                set: getInheritedPropertyDescriptor(this, attribute)?.set || ((value: keyof ModelAttributes<this>) => this.$setAttribute(attribute as any, value)) as any,
            })
            if (schema.get(attribute)!.default !== undefined) {
                this.$setAttribute(attribute as NonNullable<keyof ModelAttributes<this>>, schema.get(attribute)!.default)
            }
        }
    }

    get $isPersistent() {
        return this.$attributes.storage instanceof Object
    }

    get $adapter() {
        return (this.constructor as typeof OpaqueModel).$adapter
    }
    get $schema() {
        return (this.constructor as typeof OpaqueModel).$schema
    }

    get $primaryKeyValue(): any {
        return this.$getAttribute((this.constructor as typeof OpaqueModel).primaryKey as any)
    }

    $getAttributes(): ModelAttributes<this> {
        const attributes: any = {}
        for (const attribute of (this.constructor as typeof OpaqueModel).$schema.keys()) {
            attributes[attribute] = this.$getAttribute(attribute as NonNullable<keyof ModelAttributes<this>>)
        }
        return attributes
    }

    $hasAttribute<T extends keyof ModelAttributes<this>>(attribute: T): boolean {
        return (this.constructor as typeof OpaqueModel).$schema.has(attribute)
    }

    $getAttribute<T extends NonNullable<keyof ModelAttributes<this>>, Value extends this[T]>(attribute: T, options: Partial<GetAttributeOptions> = {}): Value {
        let value: Value;

        if (attribute in this.$attributes.local) {
            value = this.$attributes.local[attribute] as Value
        } else {
            value = this.$attributes.storage![attribute] as Value
        }
        if (!options.plain) {
            value = (this.constructor as typeof OpaqueModel).$schema.get(attribute)!.get(value)
        }
        return value
    }

    $setAttribute<T extends NonNullable<keyof ModelAttributes<this>>>(attribute: T, value: this[T], options: Partial<SetAttributeOptions> = {}): void {
        if (!this.$hasAttribute(attribute)) {
            throw new Error(`The requested attribute '${attribute}' does not exist on the model '${this.constructor.name}'!`)
        }
        if (!options.plain) {
            value = (this.constructor as typeof OpaqueModel).$schema.get(attribute)!.set(value)
        }
        this.$attributes.local[attribute] = value
    }

    $setAttributes<T extends Partial<ModelAttributes<this>>>(attributes: T): void {
        for (const key in attributes) {
            this.$setAttribute(key as any, (attributes as any)[key])
        }
    }

    $resetAll(): void {
        return this.$resetOnly(Object.keys(this.$attributes.local) as Iterable<NonNullable<keyof ModelAttributes<this>>>)
    }

    $resetOnly(attributes: Iterable<NonNullable<keyof ModelAttributes<this>>>): void {
        for (const key of attributes) {
            if (this.$isPersistent) {
                delete this.$attributes.local[key]
            } else {
                this.$attributes.local[key] = this.$schema.get(key)!.default
            }
        }
    }

    $setStorage(data: ModelAttributes<this>) {
        this.$attributes.storage = (this.constructor as typeof OpaqueModel).$deserialize(data) as any
    }

    get $ownQuery() {
        return (this.constructor as typeof OpaqueModel).$queryFor(this.$primaryKeyValue)
    }

    static $queryFor<T>(id: T) {
        return { [this.primaryKey]: { _eq: id } }
    }

    async save(): Promise<void> {
        return this.$saveAll()
    }

    async delete(): Promise<void> {
        return await this.$adapter.delete(this.$ownQuery)
    }

    async $saveOnly(attributes: Iterable<NonNullable<keyof ModelAttributes<this>>>): Promise<void> {
        const toInsert = [...attributes].reduce((toInsert, key) => ({ ...toInsert, [key]: (this.constructor as typeof OpaqueModel).$serializeAttribute(key as never, this.$getAttribute(key, { plain: true })) }), {})
        if (this.$isPersistent) {
            const updated = (await this.$adapter.update(this.$ownQuery, toInsert))?.[0]
            if (updated) {
                this.$setStorage(updated)
            }
        } else {
            this.$setStorage(await this.$adapter.create(toInsert))
        }
        this.$resetOnly(attributes)
    }

    $saveAll(): Promise<void> {
        return this.$saveOnly(Object.keys(this.$attributes.local) as Iterable<NonNullable<keyof ModelAttributes<this>>>)
    }

    async $setAndSave(attributes: Partial<ModelAttributes<this>>): Promise<void> {
        this.$setAttributes(attributes)
        this.$saveOnly(Object.keys(attributes) as Iterable<NonNullable<keyof ModelAttributes<this>>>)
    }
}