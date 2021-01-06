import QueryBuilder, { Query } from "../QueryBuilder"
import { NoOpAdapter } from "../Adapter"
import { OpaqueModel, attribute } from "../Model"
import { ModelAttributes } from "../contracts/OpaqueModel"

class TestAdapter extends NoOpAdapter {
    async read(query: Query<ModelAttributes<OpaqueModel>>) {
        return [{ title: 'hello' }]
    }
}

class Test extends OpaqueModel {
    static adapter() {
        return new TestAdapter()
    }

    @attribute()
    public title: string = ''
}

describe('QueryBuilder', () => {
    test('query', async () => {
        const query = new QueryBuilder(Test).where('title', '==', 'hello').limit(12).skip(5).$query
        expect(query).toEqual({ _limit: 12, _skip: 5, title: { _eq: 'hello' } })
        query.title
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