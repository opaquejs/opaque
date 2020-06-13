import { TestStorageAdapter } from "../index"

describe('TestStorageAdapter', () => {

    test('reset', async () => {
        const store = new TestStorageAdapter()
        await store.insert({ title: 'hallo', id: 1 })
    
        store.reset()
    
        expect(await store.get(1)).toBe(undefined)
    })

})
