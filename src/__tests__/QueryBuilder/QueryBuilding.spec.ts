import { Example, examples, runAsTest } from "@opaquejs/testing";
import { NormalizedQuery } from "@opaquejs/query";
import { attribute, OpaqueModel } from "../../Model";
import { QueryBuilder } from "../../QueryBuilder";

class TestModel extends OpaqueModel {
  @attribute({ primaryKey: true })
  id: number = 0;
  @attribute()
  title: string = "";
  @attribute()
  description: string = "";
  @attribute({ serialize: (value: number) => value.toFixed(2) })
  serializing: number = 0;

  static adapter: any;
  static query: any;
}

// const TestModel = factory.Model({
//   id: { primaryKey: true },
//   title: "",
//   description: "",
//   serializing: {
//     default: 0,
//     serialize: (value: number) => value.toFixed(2),
//   },
// });

const queryExamples: [
  (builder: QueryBuilder<typeof TestModel>) => QueryBuilder<typeof TestModel>,
  NormalizedQuery
][] = [
  // Serialize
  [(builder) => builder.where("serializing", 20), { key: "serializing", comparator: "==", value: "20.00" }],

  // Basic comparisons
  [(builder) => builder.for("test"), { key: "id", comparator: "==", value: "test" }],
  [(builder) => builder.where("title", "test"), { key: "title", comparator: "==", value: "test" }],
  [(builder) => builder.where("title", "==", "test"), { key: "title", comparator: "==", value: "test" }],
  [(builder) => builder.where("title", "!=", "test"), { key: "title", comparator: "!=", value: "test" }],
  [(builder) => builder.where("title", "<", "test"), { key: "title", comparator: "<", value: "test" }],
  [(builder) => builder.where("title", ">", "test"), { key: "title", comparator: ">", value: "test" }],
  [(builder) => builder.where("title", ">=", "test"), { key: "title", comparator: ">=", value: "test" }],
  [(builder) => builder.where("title", "<=", "test"), { key: "title", comparator: "<=", value: "test" }],
  [(builder) => builder.where("title", "in", ["test"]), { key: "title", comparator: "in", value: ["test"] }],

  // Limit and skip
  [
    (builder) => builder.where("title", "==", "test").limit(2),
    { key: "title", comparator: "==", value: "test", _limit: 2 },
  ],
  [
    (builder) => builder.where("title", "==", "test").skip(2),
    { key: "title", comparator: "==", value: "test", _skip: 2 },
  ],

  // Ordering
  [(builder) => builder.orderBy("title"), { _orderBy: [{ key: "title", direction: "asc" }] }],
  [(builder) => builder.orderBy("title", "asc"), { _orderBy: [{ key: "title", direction: "asc" }] }],
  [
    (builder) => builder.orderBy("title", "asc").orderBy("description", "desc"),
    {
      _orderBy: [
        { key: "title", direction: "asc" },
        { key: "description", direction: "desc" },
      ],
    },
  ],

  // Multiple where
  [
    (builder) => builder.where("title", "test").where("description", "other").andWhere("id", 12),
    {
      _and: [
        { key: "title", comparator: "==", value: "test" },
        { key: "description", comparator: "==", value: "other" },
        { key: "id", comparator: "==", value: 12 },
      ],
    },
  ],

  // or
  [
    (builder) => builder.where("id", 10).orWhere("title", "test"),
    {
      _or: [
        { key: "id", comparator: "==", value: 10 },
        { key: "title", comparator: "==", value: "test" },
      ],
    },
  ],
  [
    (builder) => builder.where("id", 10).orWhere("title", "test").orWhere("description", "test"),
    {
      _or: [
        { key: "id", comparator: "==", value: 10 },
        { key: "title", comparator: "==", value: "test" },
        { key: "description", comparator: "==", value: "test" },
      ],
    },
  ],
  [
    (builder) => builder.where("title", "test").orWhere((query) => query.where("description", "other")),
    {
      _or: [
        { key: "title", comparator: "==", value: "test" },
        { key: "description", comparator: "==", value: "other" },
      ],
    },
  ],
  [
    (builder) =>
      builder
        .where("title", "test")
        .orWhere((query) => query.where("description", "other").orWhere((query) => query.where("id", 12))),
    {
      _or: [
        { key: "title", comparator: "==", value: "test" },
        {
          _or: [
            { key: "description", comparator: "==", value: "other" },
            { key: "id", comparator: "==", value: 12 },
          ],
        },
      ],
    },
  ],
  [
    (builder) =>
      builder
        .skip(2)
        .limit(2)
        .orWhere((query) => query.skip(3).limit(3)),
    { _skip: 2, _limit: 2 },
  ],

  // Overwriting same attribute
  [
    (builder) => builder.where("id", "<", 10).andWhere("id", ">", 5),
    {
      _and: [
        { key: "id", comparator: "<", value: 10 },
        { key: "id", comparator: ">", value: 5 },
      ],
    },
  ],
  [
    (builder) => builder.where("id", "<", 10).andWhere("id", "<", 5),
    {
      _and: [
        { key: "id", comparator: "<", value: 10 },
        { key: "id", comparator: "<", value: 5 },
      ],
    },
  ],

  // Overloads
  [(builder) => builder.where("title", "john"), { key: "title", comparator: "==", value: "john" }],
  [(builder) => builder.orWhere("title", "john"), { key: "title", comparator: "==", value: "john" }],
  [(builder) => builder.andWhere("title", "john"), { key: "title", comparator: "==", value: "john" }],
  [(builder) => builder.where("title", "==", "john"), { key: "title", comparator: "==", value: "john" }],
  [(builder) => builder.orWhere("title", "==", "john"), { key: "title", comparator: "==", value: "john" }],
  [(builder) => builder.andWhere("title", "==", "john"), { key: "title", comparator: "==", value: "john" }],

  // More complex
  [
    (builder) =>
      builder
        .where("title", "==", "john")
        .andWhere((query) => query.where("description", "published").orWhere("id", 0)),
    {
      _and: [
        { key: "title", comparator: "==", value: "john" },
        {
          _or: [
            { key: "description", comparator: "==", value: "published" },
            { key: "id", comparator: "==", value: 0 },
          ],
        },
      ],
    },
  ],
];

@runAsTest()
export class QueryBuilding {
  @examples(...queryExamples)
  queryBuilding(
    modifier: Example<(builder: QueryBuilder<typeof TestModel>) => QueryBuilder<typeof TestModel>>,
    query: Example<NormalizedQuery>
  ) {
    // Given a query builder building the given query
    const queryBuilder = modifier(new QueryBuilder(TestModel));
    // When i get the $query attribute
    // Then it matches the given query
    expect(queryBuilder.$getQuery()).toEqual(query);
  }
}
