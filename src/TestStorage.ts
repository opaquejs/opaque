import { IdentifiableObjectStorage } from './Storage'
import refreshableStorage from './refreshableStorage'

export class TestStorage extends refreshableStorage(IdentifiableObjectStorage) {
    reset() {
        this.data = []
    }
}