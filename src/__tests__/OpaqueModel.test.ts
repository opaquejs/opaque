import { OpaqueModel, attribute } from "../Model"
import { ModelAttributes } from "../Contracts"
import { RuntimeOpaqueAdapter, RuntimeOpaqueQuery, runtime } from "../RuntimeImplementation"

const expectAttribute = <M extends OpaqueModel>(model: M) => <T extends NonNullable<keyof ModelAttributes<M>>>(attribute: T, value: M[T]) => {
    expect(model.$getAttributes()[attribute]).toBe(value)
    expect(model.$getAttribute(attribute)).toBe(value)
    expect(model[attribute]).toBe(value)
}

describe('plain js', () => {
    class Model extends runtime(OpaqueModel) {

    }
    Model.boot()
    Model.$addAttribute('attribute', { default: 'default' })

    test('default values', () => {
        expect(new Model().$getAttribute('attribute' as never)).toBe('default')
    })
})

describe('attributes', () => {
    class Model extends runtime(OpaqueModel) {
        @attribute()
        attribute: string = 'default'

        @attribute()
        undefinedAttribute?: string = undefined
    }

    test('defaults', () => {
        expectAttribute(new Model())('attribute', 'default')
        expectAttribute(new Model())('undefinedAttribute', undefined)
    })

    test('invalid undefined declaration', () => {
        class InavlidModel extends runtime(OpaqueModel) {
            @attribute()
            invalid?: string
        }
        expect(() => new InavlidModel().invalid).toThrow()
    })

    test('get/set', () => {
        const test = new Model()

        expectAttribute(test)('attribute', 'default')

        test.$setAttribute('attribute', 'changed 1')
        expectAttribute(test)('attribute', 'changed 1')

        test.attribute = 'changed 2'
        expectAttribute(test)('attribute', 'changed 2')
    })

    test('getter/setter', () => {
        class Model extends runtime(OpaqueModel) {
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
        expectAttribute(m)('test', '3€€')
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
        class Model extends OpaqueModel {
            static $adapterConstructor = RuntimeOpaqueAdapter

            @attribute()
            id?: string = undefined

            @attribute()
            title: string = ''

            @attribute()
            description: string = ''

            static query<Model extends typeof OpaqueModel>(this: Model) {
                return super.query() as RuntimeOpaqueQuery<Model>
            }
        }
        return Model
    }

    test('save', async () => {
        const Model = modelGenerator()

        const m = new Model()
        m.title = 'Title 1'
        expect(m.$isPersistent).toBe(false)
        expect(m.id).toBeUndefined()
        await m.save()

        expect(m.$isPersistent).toBe(true)
        expect(m.id).toBeDefined()
    })

    test('query', async () => {
        const Model = modelGenerator()

        const model = new Model()
        model.id = 'test'
        model.save()

        const result = await Model.query().where('id', '==', 'test').first()!
        expect(result).toBeInstanceOf(OpaqueModel)
        expect(result.id).toBe('test')
    })

    test('partial save', async () => {
        const Model = modelGenerator()

        const task = new Model()
        task.id = '1'
        task.title = 'default'
        await task.save()
        const copy = await Model.query().where('id', '==', '1').first()!

        task.title = 'my new title'
        task.description = 'my new description'
        await task.$saveOnly(['title'])
        expect(task.title).toBe('my new title')
        expect(task.description).toBe('my new description')
        expect(copy.title).toBe('my new title')
        expect(copy.description).toBe('')

        await task.$setAndSave({ title: 'my newer title' })
        expect(task.title).toBe('my newer title')
        expect(task.description).toBe('my new description')
        expect(copy.title).toBe('my newer title')
        expect(copy.description).toBe('')
    })
})