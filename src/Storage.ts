import refreshableStorage from "./refreshableStorage"
import throttled from "./throttled"
import { Model } from "./Model"

export interface Storage {
    replace(data: Array<Attributes>): void
    all(): Array<Attributes>
    insert(document: Attributes): Promise<Attributes>
    get(id: number): Promise<Attributes>
    remove(id: number): Promise<void>
}

export interface HasSerializable<T> {
    serializable(): T
}

export interface Identifiable<T extends Attribute> {
    id: T
}

export type Attribute = string | number | null

export interface Attributes<T extends Attribute = number> extends Identifiable<T> {
    [attribute: string]: Attribute
}

export class IdentifiableObjectStorage implements Storage, HasSerializable<Attributes<number>[]> {

    protected data: Attributes[] = []
    protected name: string

    constructor({ name }: { name: string }) {
        this.name = name
    }

    replace(data: Attributes[]) {
        this.data = data
    }

    all() {
        return this.data
    }

    async insert(document: Attributes) {
        const found = this.data.filter(({ id }) => id === document.id)[0]
        if (found == undefined) {
            this.data.push({ ...document })
            return await this.get(document.id)
        } else {
            for (const attribute in document) {
                if (!(['id'].includes(attribute))) {
                    found[attribute] = document[attribute]
                }
            }
            return await this.get(found.id)
        }
    }

    async get(id: number) {
        return this.data.filter(({ id: current }) => id === current)[0]
    }

    async remove(id: number) {
        const found = await this.get(id)
        if (found != undefined) {
            this.data.splice(this.data.indexOf(found), 1)
        }
    }

    serializable() {
        return this.all()
    }
}


export {
    refreshableStorage,
    throttled,
}