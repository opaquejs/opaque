import { ReactiveStorageAdapter, Attributes, Attribute, ThrottledReactiveStorageAdapter } from './Storage'
import { MappedQuery } from './Query'
import { getInheritedPropertyDescriptor } from './util'

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

  static $adapters: Map<typeof Model, ReactiveStorageAdapter> = new Map()
  static adapter: typeof ReactiveStorageAdapter = ThrottledReactiveStorageAdapter
  static $query: typeof MappedQuery = MappedQuery

  @attribute()
  public id: Attribute = null

  static get schema(): Attributes<null> {
    if(!this.schemes.has(this)) {
      this.schemes.set(this, { id: null })
    }
    return this.schemes.get(this)!
  }

  static get $adapter() {
    if(!this.$adapters.has(this)) {
      this.$adapters.set(this, new this.adapter)
    }
    return this.$adapters.get(this)!
  }

  get $adapter() {
    return (this.constructor as typeof Model).$adapter
  }

  get $query() {
    return (this.constructor as typeof Model).$adapter
  }

  // protected static get schema_map(): AttributeMap {
  //   return new Map(Object.keys(this.schema).map(attribute => [ attribute, this.schema[attribute] ]))
  // }

  constructor(...args: any[]) {
    for(const property in this.getAttributes()) {
      const inherited_descriptor = getInheritedPropertyDescriptor(this, property) || {} as PropertyDescriptor
      Object.defineProperty(this, property, {
        get: inherited_descriptor.get || (() => this.attributes[property]),
        set: inherited_descriptor.set || (value => this.attributes[property] = value),
      })
      this.setAttribute(property, this.schema[property])
    }
  }

  get $persistent() {
    return this.attributes.id != undefined
  }

  get $dirty() {
    return Object.keys(this.$attributes.local).length > 0
  }

  get attributes() {
    const attributes: Attributes | Attributes<null> = { id: null }
    for(const attribute in this.getAttributes()) {
      Object.defineProperty(attributes, attribute, {
        get: () => this.getAttribute(attribute),
        set: value => this.setAttribute(attribute, value)
      })
    }
    return attributes
  }

  getAttributes() {
    const attributes: Attributes | Attributes<null> = { id: null }
    for(const attribute in this.schema) {
      attributes[attribute] = this.getAttribute(attribute)
    }
    return attributes
  }

  getAttribute<T extends Attributes, K extends keyof T>(attribute: K): T[K] {
    return attribute in this.$attributes.local ? (this.$attributes.local as any)[attribute] : this.$attributes.storage ? (this.$attributes.storage as any)[attribute] : null as any
  }

  setAttribute(attribute: string, value: any) {
    return this.$attributes.local[attribute] = value
  }

  setAttributes<T extends Attribute>(attributes: Partial<Attributes<T>>) {
    for(const attribute in attributes) {
      this.setAttribute(attribute, attributes[attribute])
    }
  }

  static setAttribute(key: string, value: any) {
    this.schema[key] = value
  }

  async save() {
    this.$attributes.storage = await this.$adapter.insert({ ...this.$attributes.local, id: this.getAttribute('id')})
    this.$attributes.local = {}
  }

  reset() {
    this.$attributes.local = {}
    if(!this.$persistent) {
      this.setAttributes(this.schema)
    }
  }

  async remove() {
    await this.$adapter.remove(this.getAttribute('id'))
    this.$attributes.local = { ...this.getAttributes(), id: null }
    this.$attributes.storage = null
  }

  static async find<T extends Model>(this: { new (): T }, id: number): Promise<T> {
    const attributes = await (this as any as typeof Model).$adapter.get(id)
    if(attributes == undefined) {
      throw new Error(`Model with id "${id}" was not found`)
    }
    return (this as any).fromStorage(attributes)
  }

  static async create<T extends Model>(this: { new (): T }, attributes: Partial<Attributes<Attribute>> = {}) {
    const instance = new this()
    instance.setAttributes(attributes)
    await instance.save()
    return instance
  }

  static make<T extends Model>(this: { new (): T }, attributes: Partial<Attributes<null>> = {}): T {
    const instance = new this()
    instance.setAttributes(attributes)
    return instance
  }

  static fromStorage<T extends Model>(this: { new (): T }, attributes: Attributes): T {
    const instance = new this()
    instance.$attributes.storage = attributes
    instance.reset()
    return instance
  }

  static query<T extends Model>(this: new() => T): MappedQuery<Attributes, T> {
    const query: MappedQuery<Attributes, T> = new (this as any).$query((this as any).$adapter.all(), () => true, (attributes: Attributes) => (this as any).fromStorage(attributes), (instance: T) => instance.$attributes.storage);
    (this as any).$adapter.refreshables.push(query)
    return query
  }
}