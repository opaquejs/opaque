export function getInheritedPropertyDescriptor(object: object, property: string | number): PropertyDescriptor | undefined {
    if (object == null) {
        return undefined
    }
    return Object.getOwnPropertyDescriptor(object, property) || getInheritedPropertyDescriptor(Object.getPrototypeOf(object), property)
}

export type Constructor<T = {}> = new (...args: any[]) => T