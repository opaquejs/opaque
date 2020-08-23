import { IdentifiableObjectStorage } from "../Storage"

describe('Storage', () => {
    test('removing race condition is solved', async () => {
        const storage = new IdentifiableObjectStorage({ name: 'test' })

        storage.insert({ id: 1 })
        storage.insert({ id: 2 })
        storage.insert({ id: 3 })

        await Promise.all([ storage.remove(1), storage.remove(1) ])

        expect(storage.all()).toHaveLength(2)
        expect(await storage.get(1)).toBeUndefined()
        expect(await storage.get(2)).not.toBeUndefined()
        expect(await storage.get(3)).not.toBeUndefined()
    })
})
