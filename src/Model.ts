import { getInheritedPropertyDescriptor } from "./util"
import { OpaqueSchema, OpaqueModelContract, AttributeOptionsContract, ModelAttributes, AttributeObjects, GetAttributeOptions, SetAttributeOptions } from "./contracts/ModelContracts"
import { AdapterContract, OpaqueRow } from "./contracts/AdapterContracts"
import { QueryBuilder } from "./QueryBuilder"
import { Comparison } from "./contracts/QueryBuilderContracts"

export const attribute = <Type>(options: Partial<AttributeOptionsContract<Type> & { default: never }> = {}) => <M extends OpaqueModel>(model: M, property: string) => {
    const constructor = model.constructor as (new () => OpaqueModel) & typeof OpaqueModel
    constructor.boot()
    constructor.$addAttribute(property, {
        ...options,
        default: (new constructor() as any)[property]
    })
}

export class OpaqueModel implements OpaqueModelContract {
    static $schema: OpaqueSchema
    static booted: boolean
    static primaryKey: string
    static $adapter: AdapterContract

    static $getAdapter<Model extends typeof OpaqueModel>(this: Model) {
        return this.$adapter as ReturnType<Model["adapter"]>
    }

    static boot(): void {
        if (this.booted) {
            return
        }
        this.booted = true

        this.primaryKey = this.primaryKey || 'id'

        Object.defineProperty(this, '$schema', { value: new Map() })
        Object.defineProperty(this, '$adapter', { value: this.adapter() })
    }

    static adapter(): AdapterContract {
        throw Error(`No adapter for model ${this.name} Implemented!`)
    }

    static $addAttribute<Type>(name: string, options: Partial<AttributeOptionsContract<Type>> = {}): void {
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

    static $fromRow<Model extends new () => OpaqueModel>(this: Model, data: OpaqueRow) {
        const model = new this() as InstanceType<Model>
        model.$setRow(data)
        model.$resetAll()
        return model
    }

    static query<Model extends (new () => OpaqueModel) & typeof OpaqueModel>(this: Model) {
        return new QueryBuilder(this)
    }

    static async find<Model extends (new () => OpaqueModel) & typeof OpaqueModel>(this: Model, key: any) {
        return await this.query().where(this.primaryKey as keyof ModelAttributes<InstanceType<Model>>, Comparison._eq, key).first()
    }

    static $serializeAttribute(key: string, value: any) {
        const attribute = this.$schema.get(key)
        return attribute ? attribute.serialize(value) : value
    }
    static $serialize(data: OpaqueRow) {
        return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, this.$serializeAttribute(key, value)]))
    }

    static $deserializeAttribute(key: string, value: any) {
        const attribute = this.$schema.get(key)
        return attribute ? attribute.deserialize(value) : value
    }
    static $deserialize(data: OpaqueRow) {
        return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, this.$deserializeAttribute(key, value)]))
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

    $attributes: AttributeObjects = {
        local: {}
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

    $hasAttribute(attribute: string): boolean {
        return (this.constructor as typeof OpaqueModel).$schema.has(attribute)
    }

    $getAttribute(attribute: string, options: Partial<GetAttributeOptions> = {}) {
        let value: any;

        if (!this.$hasAttribute(attribute)) {
            throw new Error(`The requested attribute '${attribute}' does not exist on the model '${this.constructor.name}'!`)
        }

        if (attribute in this.$attributes.local) {
            value = this.$attributes.local[attribute]
        } else {
            value = this.$attributes.storage![attribute]
        }
        if (!options.plain) {
            value = (this.constructor as typeof OpaqueModel).$schema.get(attribute)!.get(value)
        }
        return value
    }

    $setAttribute(attribute: string, value: any, options: Partial<SetAttributeOptions> = {}) {
        if (!this.$hasAttribute(attribute)) {
            throw new Error(`The requested attribute '${attribute}' does not exist on the model '${this.constructor.name}'!`)
        }
        if (!options.plain) {
            value = (this.constructor as typeof OpaqueModel).$schema.get(attribute)!.set(value)
        }
        this.$attributes.local[attribute] = value
        return this
    }

    $setAttributes(attributes: OpaqueRow, options?: Partial<SetAttributeOptions>) {
        for (const key in attributes) {
            this.$setAttribute(key as any, (attributes as any)[key], options)
        }
        return this
    }

    $resetAll() {
        return this.$resetOnly(Object.keys(this.$attributes.local) as Iterable<NonNullable<keyof ModelAttributes<this>>>)
    }

    $resetOnly(attributes: Iterable<NonNullable<keyof ModelAttributes<this>>>) {
        for (const key of attributes) {
            if (this.$isPersistent) {
                delete this.$attributes.local[key]
            } else {
                this.$attributes.local[key] = this.$schema.get(key)!.default
            }
        }
        return this
    }

    $setRow(data: OpaqueRow) {
        this.$attributes.storage = (this.constructor as typeof OpaqueModel).$deserialize(data)
        return this
    }

    get $ownQuery() {
        return (this.constructor as typeof OpaqueModel).$queryFor(this.$primaryKeyValue)
    }

    static $queryFor<T>(id: T) {
        return { [this.primaryKey]: { _eq: id } }
    }

    async save() {
        return this.$saveAll()
    }

    async delete() {
        return await this.$adapter.delete(this.$ownQuery)
    }

    async $saveOnly(attributes: Iterable<NonNullable<keyof ModelAttributes<this>>>) {
        const toInsert = (this.constructor as typeof OpaqueModel).$serialize([...attributes].reduce((toInsert, key) => ({ ...toInsert, [key]: this.$getAttribute(key, { plain: true }) }), {}))
        if (this.$isPersistent) {
            const updated = (await this.$adapter.update(this.$ownQuery, toInsert))?.[0]
            if (updated) {
                this.$setRow(updated)
            }
        } else {
            this.$setRow(await this.$adapter.create(toInsert))
        }
        return this.$resetOnly(attributes)
    }

    $saveAll() {
        return this.$saveOnly(Object.keys(this.$attributes.local) as Iterable<NonNullable<keyof ModelAttributes<this>>>)
    }

    async $setAttributesAndSave(attributes: Partial<ModelAttributes<this>>) {
        this.$setAttributes(attributes)
        this.$saveOnly(Object.keys(attributes) as Iterable<NonNullable<keyof ModelAttributes<this>>>)
        return this
    }
}