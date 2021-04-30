import { runAsTest } from "@opaquejs/testing";
import { QueryBuilder, QueryBuilderImplementation } from "../../QueryBuilder";
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

@runAsTest()
export class QueryBuilding extends BaseTest {
  async update() {
    // Given a query builder
    const builder = new QueryBuilderImplementation(TestModel);
    // When I call update()
    builder.$cloneForQuery("query" as any).update({ title: "update" });
    // Then the adapters update method was called with the appropriate args
    expect(TestModel.adapter.update).toHaveBeenCalledWith("query", { title: "update" });
  }

  async delete() {
    // Given a query builder
    const builder = new QueryBuilderImplementation(TestModel);
    // When I call delete()
    await builder.$cloneForQuery("query" as any).delete();
    // Then the adapters delete method was called with the appropriate args
    expect(TestModel.adapter.delete).toHaveBeenCalledWith("query");
  }

  async get() {
    // Given a query builder
    const builder = new QueryBuilderImplementation(TestModel);
    // When I call update()
    await builder.$cloneForQuery("query" as any).get();
    // Then the adapters read method was called the appropriate args
    expect(TestModel.adapter.read).toHaveBeenCalledWith("query");
  }
  async first() {
    // Given a query builder
    const builder = new QueryBuilderImplementation(TestModel);
    // When I call first()
    await builder.first();
    // Then the adapters read method was called with limit 1
    expect(TestModel.adapter.read).toHaveBeenCalledWith({ _limit: 1 });
  }
}
