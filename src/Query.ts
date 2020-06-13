export type Filter<T> = (attribute: T) => boolean

export interface Refreshable {
    refresh(): void
}

export interface Refreshes {
    refreshables: Array<Refreshable>
}

export const Comparisons = {
    '==': <T>(attribute: keyof T, value: any) => (attributes: T) => attributes[attribute] == value,
    '===': <T>(attribute: keyof T, value: any) => (attributes: T) => attributes[attribute] === value,
    '!=': <T>(attribute: keyof T, value: any) => (attributes: T) => attributes[attribute] != value,
    '>': <T>(attribute: keyof T, value: any) => (attributes: T) => attributes[attribute] > value,
    '<': <T>(attribute: keyof T, value: any) => (attributes: T) => attributes[attribute] < value,
}

export class Query<T extends Object> implements Refreshable, Refreshes {

    public results: Array<T> = []
    public refreshables: Array<Refreshable> = []
    constructor(protected base: Array<T>, protected $filter: Filter<T> = () => true) {
        this.refresh()
    }

    make(filter: Filter<T>): this {
        return new (<any>this.constructor)(this.results, filter)
    }

    filter(filter: Filter<T>): this {
        const instance = this.make(filter)
        this.refreshables.push(instance)
        return instance
    }

    where(attribute: keyof T, comparison: keyof typeof Comparisons, value: any): this {
                
        if(!(comparison in Comparisons)) {
            throw new Error('Unknown comparison: ' + comparison)
        }
        
        return this.filter(Comparisons[comparison](attribute, value))
    }

    raw(): T[] {
        return this.results
    }

    static refresh<A>(from: Array<A>, to: Array<A>): void {
        for(const item of to) {
            if(from.indexOf(item) < 0) {
                to.splice(to.indexOf(item), 1)
            }
        }
        for(const item of from) {
            if(to.indexOf(item) < 0) {
                to.push(item)
            }
        }
    }

    refresh(): void {
        const refreshed = this.base.filter(this.$filter);

        (this.constructor as typeof Query).refresh(refreshed, this.results)

        for(const refreshable of this.refreshables) {
            refreshable.refresh()
        }
    }

}

export class MappedQuery<Original, Mapped> extends Query<Original> {
    public mapped: Array<Mapped> = []
    private readonly initialized_mapped: boolean = true
    constructor(base: Array<Original>, filter: Filter<Original>, protected forwards: (original: Original) => Mapped, protected backwards: (mapped: Mapped) => Original) {
        super(base, filter)
        this.refreshMapped()
    }

    get() {
        return this.mapped
    }

    make(filter: Filter<Original>): this {
        return new (this.constructor as typeof MappedQuery)(this.results, filter, this.forwards, this.backwards) as this
    }

    refreshMapped() {
        for(const mapped of this.mapped) {
            if(this.results.indexOf(this.backwards(mapped)) < 0) {
                this.mapped.splice(this.mapped.indexOf(mapped), 1)
            }
        }

        const originals_from_mapped = this.mapped.map(mapped => this.backwards(mapped))
        for(const original of this.results) {
            if(originals_from_mapped.indexOf(original) < 0) {
                this.mapped.push(this.forwards(original))
            }
        }
    }

    refresh() {
        super.refresh()

        if(this.initialized_mapped) {
            this.refreshMapped()
        }
    }
}