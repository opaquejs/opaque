import { attribute, OpaqueModel } from "../Model"
import { ModelAttributes } from "../Contracts"
import { NoOpAdapter } from "../Adapter"

const expectAttribute = <M extends TestModel>(model: M) => <T extends NonNullable<keyof ModelAttributes<M>>>(attribute: T, value: M[T]) => {
    expect(model.$getAttributes()[attribute]).toBe(value)
    expect(model.$getAttribute(attribute)).toBe(value)
    expect(model[attribute]).toBe(value)
}

class TestModel extends OpaqueModel {
    static $adapterConstructor = NoOpAdapter
}

describe('plain js', () => {
    class Model extends TestModel {

    }
    Model.boot()
    Model.$addAttribute('attribute', { default: 'default' })

    test('default values', () => {
        expect(new Model().$getAttribute('attribute' as never)).toBe('default')
    })
})

describe('attributes', () => {
    class Model extends TestModel {
        @attribute()
        attribute: string = 'default'

        @attribute()
        undefinedAttribute?: string = undefined

        @attribute({
            serialize: (date?: Date & { ignore?: boolean }) => date?.ignore ? undefined : date?.toISOString(),
            deserialize: (date: unknown) => typeof date == 'string' ? new Date(date) : undefined,
        })
        public serializing?: Date = undefined
    }

    test('defaults', () => {
        expectAttribute(new Model())('attribute', 'default')
        expectAttribute(new Model())('undefinedAttribute', undefined)
    })

    test('invalid undefined declaration', () => {
        class InavlidModel extends TestModel {
            @attribute()
            invalid?: string
        }
        expect(() => new InavlidModel().invalid).toThrow()
    })

    test('serialize', () => {
        const test = Model.$fromStorage({ serializing: '2020-12-24T00:00:00', attribute: 'default', undefinedAttribute: 'lel' })
        expect(test.serializing).toBeInstanceOf(Date)

        const date = new Date()
        const ignoreDate: Date & { ignore?: boolean } = new Date()
        ignoreDate.ignore = true
        expect(Model.$serializeAttribute('serializing', date)).toBe(date.toISOString())
        expect(Model.$deserializeAttribute('serializing', 12)).toBe(undefined)
        expect(Model.$serializeAttribute('serializing', ignoreDate)).toBe(undefined)
    })

    test('get/set', () => {
        const test = new Model()

        expectAttribute(test)('attribute', 'default')

        test.$setAttribute('attribute', 'changed 1')
        expectAttribute(test)('attribute', 'changed 1')

        test.attribute = 'changed 2'
        expectAttribute(test)('attribute', 'changed 2')
    })

    test('getter/setter', async () => {
        class Model extends TestModel {
            @attribute<string>({
                get: value => value + '€',
                set: value => value.replace('€', '')
            })
            test: string = ''
        }

        const m = new Model()
        m.test = '3'
        expectAttribute(m)('test', '3€')

        m.test = '3€'
        expectAttribute(m)('test', '3€')

        expect(m.$getAttribute('test', { plain: true })).toBe('3')

        m.$setAttribute('test', '3€', { plain: true })
        expect(m.$getAttribute('test', { plain: true })).toBe('3€')
        expectAttribute(m)('test', '3€€')

        m.$adapter.create = ({ test }) => {
            expect(test).not.toBe('3€€')
            expect(test).toBe('3€')
            return Promise.resolve({})
        }
        await m.save()
    })

    test('reset', () => {
        const m = new Model()

        m.attribute = 'changed'
        m.$resetAll()
        expectAttribute(m)('attribute', 'default')

        m.attribute = 'changed'
        m.$resetOnly(['undefinedAttribute'])
        expectAttribute(m)('attribute', 'changed')
    })
})

describe('adapter', () => {
    const modelGenerator = () => {
        class Model extends TestModel {

            @attribute()
            id?: string = undefined

            @attribute()
            title: string = ''

            @attribute()
            description: string = ''
        }
        return Model
    }

    test('create', async () => {
        const Model = modelGenerator()

        const m = new Model()
        m.title = 'Title 1'

        let data = undefined
        Model.$adapter.create = d => data = d as any
        await m.$saveOnly(['title'])
        expect(data).toEqual({ title: 'Title 1' })
    })

    test('update', async () => {
        const Model = modelGenerator()

        const m = new Model()
        m.id = 'lel'
        m.title = 'Title 1'
        m.$attributes.storage = {} as any

        let query = undefined
        let data = undefined
        Model.$adapter.update = (q, d): any => {
            data = d as any
            query = q
        }
        await m.$saveOnly(['title'])
        expect(query).toEqual({ id: { _eq: 'lel' } })
        expect(data).toEqual({ title: 'Title 1' })
    })

    test('delete', async () => {
        const Model = modelGenerator()

        const m = new Model()
        m.id = 'lel'
        m.title = 'Title 1'
        m.$attributes.storage = {} as any

        let query = undefined
        Model.$adapter.delete = (q): any => {
            query = q
        }
        await m.delete()
        expect(query).toEqual({ id: { _eq: 'lel' } })
    })

    // test('query', async () => {
    //     const Model = modelGenerator()

    //     const model = new Model()
    //     model.title = 'test'
    //     model.save()

    //     const result = (await Model.query().where('title', Comparison.$eq, 'test').first())!
    //     expect(result).toBeInstanceOf(TestModel)
    //     expect(result.title).toBe('test')
    // })

    // test('partial save', async () => {
    //     const Model = modelGenerator()

    //     const task = new Model()
    //     task.title = 'default'
    //     await task.save()
    //     const copy = (await Model.find(task.id!))!

    //     task.title = 'my new title'
    //     task.description = 'my new description'
    //     await task.$saveOnly(['title'])
    //     expect(task.title).toBe('my new title')
    //     expect(task.description).toBe('my new description')
    //     expect(copy.title).toBe('my new title')
    //     expect(copy.description).toBe('')

    //     await task.$setAndSave({ title: 'my newer title' })
    //     expect(task.title).toBe('my newer title')
    //     expect(task.description).toBe('my new description')
    //     expect(copy.title).toBe('my newer title')
    //     expect(copy.description).toBe('')
    // })
})