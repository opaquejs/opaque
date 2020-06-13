import { ReactiveStorageAdapter } from './Storage'

export class TestStorageAdapter extends ReactiveStorageAdapter {
    reset() {
        this.data = []
    }
}