import { getInheritedPropertyDescriptor } from "../util"

test('getInheritedPropertyDescriptor', async () => {
    class Main {
        set test(value: any) {
            (this as any)._test = value
        }
    }

    class Test extends Main {
        get test() {
            return 'test'
        }
    }

    const test = new Test()

    const descriptor = getInheritedPropertyDescriptor(test, 'test')

    expect(descriptor!.get).toBeInstanceOf(Function)
    expect(descriptor!.set).toBe(undefined)
})