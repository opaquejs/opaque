import { inject, provide } from "@opaquejs/testing";
import { runWithJest } from "@opaquejs/testing/lib/jest";
import { QueryBuilderImplementation } from "../../QueryBuilder";
import { BaseTest } from "../helpers/BaseTest";
import factory from "../helpers/factory";

const TestModel = factory.Model({
  id: { primaryKey: true },
  title: "",
  description: "",
  serializing: {
    default: 0,
    serialize: (value: number) => value.toFixed(2),
  },
});

@runWithJest()
@provide(QueryBuilderImplementation, () => new QueryBuilderImplementation(TestModel))
export class QueryBuilding extends BaseTest {
  async update(@inject() builder: QueryBuilderImplementation) {
    // When I call update()
    builder.$cloneForQuery("query" as any).update({ title: "update" });
    // Then the adapters update method was called with the appropriate args
    expect(TestModel.adapter.update).toHaveBeenCalledWith(TestModel, "query", { title: "update" });
  }

  async delete(@inject() builder: QueryBuilderImplementation) {
    // When I call delete()
    await builder.$cloneForQuery("query" as any).delete();
    // Then the adapters delete method was called with the appropriate args
    expect(TestModel.adapter.delete).toHaveBeenCalledWith(TestModel, "query");
  }

  async get(@inject() builder: QueryBuilderImplementation) {
    // When I call update()
    await builder.$cloneForQuery("query" as any).get();
    // Then the adapters read method was called the appropriate args
    expect(TestModel.adapter.read).toHaveBeenCalledWith(TestModel, "query");
  }
  async first(@inject() builder: QueryBuilderImplementation) {
    // When I call first()
    await builder.first();
    // Then the adapters read method was called with limit 1
    expect(TestModel.adapter.read).toHaveBeenCalledWith(TestModel, { _limit: 1 });
  }
}
