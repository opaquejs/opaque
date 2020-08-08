import { attribute, Model } from '../Model'
import { TestStorage } from '../TestStorage'

class TestModel extends Model {
    static storage: typeof TestStorage = TestStorage
}

class Task extends TestModel {
    @attribute()
    public title: string | null = null
}

class User extends TestModel {
    @attribute()
    public email: string = ''
}

class JSTask extends TestModel {
    static get schema() {
        return {
            id: null,
            title: 'default',
            importance: 0,
            tags: '[]',
        }
    }

    set importance(value: any) {
        this.attributes.importance = parseInt(value)
    }

    get tags() {
        return JSON.parse(this.attributes.tags as string).map((id: number) => ({ id }))
    }
}


beforeEach(() => {
    (Task.$storage as TestStorage).reset()
})

describe('Model', () => {

    test('attributes', () => {
        const model = new Task()
        model.title = 'test'

        expect(model.getAttribute('title')).toBe('test')
        expect(model.getAttributes().title).toBe('test')
        expect(model.attributes.title).toBe('test')
        expect(model.title).toBe('test')

        model.setAttribute('title', 'neuer')
        expect(model.getAttribute('title')).toBe('neuer')
        expect(model.attributes.title).toEqual('neuer')
        expect(model.title).toBe('neuer')

        expect(model.getAttributes()).toEqual({ id: null, title: 'neuer' })


        model.title = 'changed'
        expect(model.title).toBe('changed')
        expect(model.attributes.title).toBe('changed')

        expect((JSTask.make() as any).title).toBe('default')
    })

    test('$dirty', async () => {
        const task = new Task()
        expect(task.$dirty).toBe(true)

        task.title = 'Test'
        expect(task.$dirty).toBe(true)

        await task.save()
        expect(task.$dirty).toBe(false)
    })

    test('custom getters and setters', async () => {
        const task = new JSTask() as any
        task.importance = '1'
        expect(task.importance).toBe(1)

        expect(task.tags).toEqual([])
        task.tags = '[1,2]'
        expect(task.tags).toEqual([{ id: 1 }, { id: 2 }])
    })

    test('save', async () => {
        const task = new Task()
        task.title = 'lel'
        task.id = 1

        await task.save()
        expect(task.title).toBe('lel')

        const copy = await Task.find(task.id)
        expect(copy.title).toBe(task.title)
        expect(copy.id).toBe(task.id)

        copy.title = 'changed'
        expect(copy.title).toBe('changed')
        expect(task.title).not.toBe('changed')

        await copy.save()
        expect(task.title).toBe('changed')
    })

    test('find', async () => {
        const task = await Task.create({ title: 'task', id: 1 })

        const found = await Task.find(task.id as number)
        expect(found.id).toBe(task.id)

        expect(async () => {
            await Task.find(389457)
        }).rejects.toThrow()
    })

    test('reset', async () => {
        const task = new Task()
        task.title = 'task'
        task.reset()
        expect(task.title).toBe(null)

        task.title = 'task'
        task.id = 1
        await task.save()

        task.title = 'something'
        task.reset()
        expect(task.title).toBe('task')
    })

    test('create', async () => {
        const task = await Task.create({ title: 'created', id: 1 })
        expect(task.$persistent).toBe(true)
        expect(task.title).toBe('created')
        expect((await Task.find(task.id as number)).title).toBe('created')
    })

    test('remove', async () => {
        const task = await Task.create({ title: 'task', id: 1 })

        await task.remove()

        expect(() => Task.find(task.id as number)).rejects.toThrow()
        expect(task.$persistent).toBe(false)
        expect(task.title).toBe('task')

        task.id = 1
        await task.save()
        expect(task.$persistent).toBe(true)
    })

    test('query', async () => {
        const query = Task.query()
        const results = query.get()
        expect(results).toEqual([])

        const first = await Task.create({ title: 'first', id: 1 })
        expect(results).toEqual([first])

        const second = await Task.create({ title: 'second', id: 2 })
        expect(results).toEqual([first, second])

        await first.remove()
        expect(results).toEqual([second])

        first.id = 1
        await first.save()
        expect(query.where('title', '==', 'first').get()).toEqual([first])

    })

    test('multiple models', async () => {
        expect(User.schema).not.toBe(Task.schema)

        await Task.create({ title: 'test', id: 1 })
        await expect(() => User.find(1)).rejects.toThrow()
    })

})
