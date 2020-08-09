import { IdentifiableObjectStorage, Attributes, Storage } from "./Storage"
import { Refreshable, Refreshes } from "./Query"
import { Constructor } from "./util"

export default <T extends Constructor<Storage>>(base: T) => class RefreshableStorage extends base implements Refreshes {
    public refreshables: Array<Refreshable> = []

    refresh() {
        for (const refreshable of this.refreshables) {
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