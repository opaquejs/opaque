import { Refreshes, Refreshable } from './Query'

export abstract class StorageAdapter {
    public abstract all(): Array<Attributes>
    public abstract insert(document: Attributes): Promise<Attributes>
    public abstract get(id: number): Promise<Attributes>
    public abstract remove(id: number): Promise<void>
}

export interface Identifiable<T extends Attribute> {
    id: T
}

export type Attribute = string | number | null

export interface Attributes<T extends Attribute = number> extends Identifiable<T> {
    [attribute: string]: Attribute
}
  
export class IdentifiableStorageAdapter implements StorageAdapter {

    protected data: Attributes[] = []
    protected last_id: number = 0

    all() {
        return this.data
    }

    async insert(document: Attributes) {
        const found = this.data.filter(({ id }) => id === document.id)[0]
        if(found == undefined) {
            this.data.push({ ...document })
            return await this.get(document.id)
        } else {
            for(const attribute in document) {
                if(!([ 'id' ].includes(attribute))) {
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
        if(found != undefined) {
            this.data.splice(this.data.indexOf(found), 1)
        }
    }
}

export class ReactiveStorageAdapter extends IdentifiableStorageAdapter implements Refreshes {
    public refreshables: Array<Refreshable> = []

    refresh() {
        for(const refreshable of this.refreshables) {
            refreshable.refresh()
        }
    }

    async insert(document: Attributes) {
        const result = await super.insert(document)
        this.refresh()
        return result
    }

    async remove(id: number) {
        const result = await super.remove(id)
        this.refresh()
        return result
    }
}

export class ThrottledReactiveStorageAdapter extends ReactiveStorageAdapter {
    protected refresh_planned: boolean = false

    refresh() {
        if(!this.refresh_planned) {
            this.refresh_planned = true
            setTimeout(() => {
                this.refresh_planned = false
                super.refresh()
            }, 0)
        }
    }
}