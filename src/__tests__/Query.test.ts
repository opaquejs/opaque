import { Query, Comparisons } from '../Query'

test('query', async () => {
    const data = [
        { title: 'a', id: 0 },
        { title: 'ab', id: 1 },
        { title: 'abc', id: 2 },
        { title: 'abcd', id: 3 },
        { title: 'abcde', id: 4 },
        { title: 'abcdef', id: 5 },
        { title: 'abcdefg', id: 6 },
    ]

    const query = new Query(data)

    expect(query.raw()).toHaveLength(data.length)
    expect(query.raw()).toEqual(data)

    const f = query.filter(({ title }) => title.includes('f')).raw()
    const g = query.filter(({ title }) => title.includes('g')).raw()

    expect(g).toHaveLength(1)
    expect(g).toEqual([ { title: 'abcdefg', id: 6 } ])

    expect(f).toHaveLength(2)
    expect(f).toEqual([ { title: 'abcdef', id: 5 }, { title: 'abcdefg', id: 6 } ])
    

    data.push({ title: 'g', id: 7 })
    query.refresh()

    expect(g).toHaveLength(2)
    expect(g).toEqual([ { title: 'abcdefg', id: 6 }, { title: 'g', id: 7 } ])

    expect(f).toHaveLength(2)
    expect(f).toEqual([ { title: 'abcdef', id: 5 },{ title: 'abcdefg', id: 6 } ])

    expect(query.where('title', '==', 'ab').raw()).toEqual([{ title: 'ab', id: 1 }])
    expect(query.where('title', '===', 'ab').raw()).toEqual([{ title: 'ab', id: 1 }])
    expect(query.where("id", '<', 1).raw()).toEqual([{ title: 'a', id: 0 }])
    expect(query.where("id", '>', 6).raw()).toEqual([{ title: 'g', id: 7 }])
    expect(() => query.where("id", 'not availabe' as keyof typeof Comparisons, 6)).toThrow()
})