import { Refreshable } from "./Query"
import { Constructor } from './util'

export default <T extends Constructor<Refreshable>>(base: T) => class ThrottledStorage extends base {
    protected refresh_planned: boolean = false

    refresh() {
        if (!this.refresh_planned) {
            this.refresh_planned = true
            setTimeout(() => {
                this.refresh_planned = false
                super.refresh()
            }, 0)
        }
    }
}
