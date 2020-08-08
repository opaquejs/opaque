import { ReactiveStorage } from './Storage'

export class TestStorage extends ReactiveStorage {
    reset() {
        this.data = []
    }
}