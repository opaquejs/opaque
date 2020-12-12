import QueryBuilder, { Query } from "../QueryBuilder"
import { ModelAttributes } from "../Contracts"
import { NoOpAdapter } from "../Adapter"
import { OpaqueModel, attribute } from "../Model"

class Test extends OpaqueModel {
    static $adapterConstructor = class extends NoOpAdapter<ModelAttributes<Test>> {
        async read(query: Query<ModelAttributes<Test>>) {
            return [{ title: 'hello' }]
        }
    }

    @attribute()
    public title: string = ''
}

describe('QueryBuilder', () => {
    test('query', async () => {
        const query = new QueryBuilder(Test).where('title', '==', 'hello').limit(12).skip(5).or(query => query.where('title', '!=', 'hello')).orWhere('title', '<', '12').$query
        expect(query).toEqual({ $limit: 12, $skip: 5, title: { $eq: 'hello' }, $or: [{ title: { $ne: 'hello' } }, { title: { $lt: '12' } }] })
    })
    test('get', async () => {
        const result = await (new QueryBuilder(Test).get())
        expect(result).toHaveLength(1)
        expect(result[0]).toBeInstanceOf(Test)
        expect(result[0].title).toBe('hello')
    })
    test('first', async () => {
        const result = await (new QueryBuilder(Test).first())
        expect(result).toBeInstanceOf(Test)
        expect(result?.title).toBe('hello')
    })
})