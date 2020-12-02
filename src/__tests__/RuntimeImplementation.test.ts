import { RuntimeOpaqueAdapter, runtime } from "../RuntimeImplementation"
import { OpaqueModel, attribute } from "../Model"

class Model extends runtime(OpaqueModel) {
    @attribute({ primaryKey: true })
    public id?: string
}

describe('Runtime Implementation', () => {
    test('keeps given id on create', async () => {
        await Model.$adapter.create({ id: '12' })

        expect(await Model.$adapter.read({ id: '12' })).toHaveLength(1)
    })
})