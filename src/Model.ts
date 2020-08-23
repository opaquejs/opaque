import { Attributes, Attribute, IdentifiableObjectStorage, Storage } from './Storage'
import { MappedQuery, Refreshable } from './Query'
import { getInheritedPropertyDescriptor, Constructor } from './util'
import throttled from './throttled'
import refreshableStorage from './refreshableStorage'

export function attribute() {
  return (target: any, key: string) => {
    const BaseModel = target.constructor
    const model = new BaseModel()
    BaseModel.setAttribute(key, model[key])
  }
}

export class Model {

  protected $attributes: { local: Partial<Attributes<null>>, storage: Attributes | null } = {
    local: {},
    storage: null,
  }

  protected static schemes: Map<typeof Model, Attributes<null>> = new Map()
  protected schema: Attributes<null> = (this.constructor as typeof Model).schema

  static $storages: Map<typeof Model, Storage> = new Map()
  static storage: Constructor<IdentifiableObjectStorage & Refreshable> = throttled(refreshableStorage(IdentifiableObjectStorage))
  static $query: typeof MappedQuery = MappedQuery

  @attribute()
  public id: Attribute = null

  static get schema(): Attributes<null> {
    if (!this.schemes.has(this)) {
      this.schemes.set(this, { id: null })
    }
    return this.schemes.get(this)!
  }

  static get $storage() {
    if (!this.$storages.has(this)) {
      this.$storages.set(this, new this.storage(this))
    }
    return this.$storages.get(this)!
  }

  get $storage() {
    return (this.constructor as typeof Model).$storage
  }

  get $query() {
    return (this.constructor as typeof Model).$query
  }

  // protected static get schema_map(): AttributeMap {
  //   return new Map(Object.keys(this.schema).map(attribute => [ attribute, this.schema[attribute] ]))
  // }

  constructor(...args: any[]) {
    for (const property in this.getAttributes()) {
      const inherited_descriptor = getInheritedPropertyDescriptor(this, property) || {} as PropertyDescriptor
      Object.defineProperty(this, property, {
        get: inherited_descriptor.get || (() => this.attributes[property]),
        set: inherited_descriptor.set || (value => this.attributes[property] = value),
      })
    }
  }

  get $persistent() {
    return this.$attributes.storage != null
  }

  get $dirty() {
    return Object.keys(this.$attributes.local).length > 0
  }

  get attributes() {
    const attributes: Attributes | Attributes<null> = { id: null }
    for (const attribute in this.getAttributes()) {
      Object.defineProperty(attributes, attribute, {
        get: () => this.getAttribute(attribute),
        set: value => this.setAttribute(attribute, value)
      })
    }
    return attributes
  }

  getAttributes() {
    const attributes: Attributes | Attributes<null> = { id: null }
    for (const attribute in this.schema) {
      attributes[attribute] = this.getAttribute(attribute)
    }
    return attributes
  }

  getAttribute<T extends Attributes, K extends keyof T>(attribute: K): T[K] | null {
    if(attribute in this.$attributes.local) {
      return (this.$attributes.local as any)[attribute]
    }
    if(this.$attributes.storage && attribute in this.$attributes.storage) {
      return (this.$attributes.storage as any)[attribute]
    }
    if(attribute in this.schema) {
      return (this.schema as any)[attribute]
    }
    return null
  }

  setAttribute(attribute: string, value: any) {
    return this.$attributes.local[attribute] = value
  }

  setAttributes<T extends Attribute>(attributes: Partial<Attributes<T>>) {
    for (const attribute in attributes) {
      this.setAttribute(attribute, attributes[attribute])
    }
  }

  static setAttribute(key: string, value: any) {
    this.schema[key] = value
  }

  async saveAttributes<T extends Model, K extends Attribute>(this: T, attributes: Partial<Attributes<K>>): Promise<void> {
    this.$attributes.storage = await this.$storage.insert({ ...attributes, id: this.getAttribute('id')! })
    this.resetOnly(Object.keys(attributes) as (keyof T)[])
  }

  async saveOnly(attributes: (keyof Attributes)[]): Promise<void> {
    const to_save: Partial<Attributes> = {}

    for(const attribute of attributes) {
      to_save[attribute] = this.$attributes.local[attribute]
    }

    return await this.saveAttributes(to_save)
  }

  async save(): Promise<void> {
    return await this.saveAttributes(this.$attributes.local)
  }

  resetAll(): void {
    for (const key in this.$attributes.local) {
      delete this.$attributes.local[key]
    }
  }

  resetOnly<T extends Model, K extends keyof T>(this: T, attributes: Array<K>): void {
    for (const key of attributes) {
      delete this.$attributes.local[key as any]
    }
  }

  async remove() {
    if(this.$persistent) {
      await this.$storage.remove(this.getAttribute('id')!)
      this.setAttributes({ ...this.getAttributes(), id: null })
      this.$attributes.storage = null
    }
  }

  static async find<T extends Model>(this: { new(): T }, id: number): Promise<T> {
    return (this as any).fromId(id)
  }

  static async create<T extends Model>(this: { new(): T }, attributes: Partial<Attributes<Attribute>> = {}): Promise<T> {
    const instance = (this as any).make(attributes)
    await instance.save()
    return instance
  }

  static make<T extends Model>(this: { new(): T }, attributes: Partial<Attributes<null>> = {}): T {
    const instance = new this()
    instance.setAttributes(attributes)
    return instance
  }

  static fromStorage<T extends Model>(this: { new(): T }, attributes: Attributes): T {
    const instance = new this()
    instance.$attributes.storage = attributes
    instance.resetAll()
    return instance
  }

  static async fromId<T extends Model>(this: { new(): T }, id: number): Promise<T> {
    const attributes = await (this as any as typeof Model).$storage.get(id)
    if (attributes == undefined) {
      throw new Error(`Model with id "${id}" was not found`)
    }
    return (this as any).fromStorage(attributes)
  }

  static query<T extends Model>(this: new () => T): MappedQuery<Attributes, T> {
    const query: MappedQuery<Attributes, T> = new (this as any).$query((this as any).$storage.all(), () => true, (attributes: Attributes) => (this as any).fromStorage(attributes), (instance: T) => instance.$attributes.storage);
    (this as any).$storage.refreshables.push(query)
    return query
  }
}