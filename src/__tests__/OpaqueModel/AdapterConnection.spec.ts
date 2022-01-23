import factory from "../helpers/factory";
import { PrimaryKeyValue } from "../../contracts/ModelContracts";
import { BaseTest } from "../helpers/BaseTest";
import { ignore } from "@opaquejs/testing";
import { runWithJest } from "@opaquejs/testing/lib/jest";

@runWithJest()
export class AdapterConnectionTest extends BaseTest {
  @ignore()
  // "Item" Model with getter and serializer
  Item = factory.Model({
    id: {
      default: "",
      primaryKey: true,
    },
    price: {
      default: 0,
      get: (value: number) => Math.floor(value),
      serialize: (value: number) => value.toFixed(2),
    },
  });

  _queryFor(key: PrimaryKeyValue) {
    return this.Item.query().for(key).$getQuery();
  }

  async create() {
    // Given an Item instance
    const item = this.Item.make({ price: 12.9 });
    // When I save the Model
    await item.save("price");
    // Then the adapter "insert" method gets called with the raw, serialized value
    expect(this.Item.adapter.insert).toHaveBeenCalledWith(this.Item, { price: "12.90" });
  }

  async update() {
    // Given a persistent Item instance
    const item = this.Item.$fromRow({ id: "update", price: 12.9 });
    // When I save the price
    await item.save("price");
    // Then the adapter gets called with an appropriate query and the raw, serialized value
    expect(this.Item.adapter.update).toHaveBeenCalledWith(this.Item, this._queryFor("update"), { price: "12.90" });
  }

  async delete() {
    // Given a persistent Item instance
    const item = this.Item.$fromRow({ id: "delete" });
    // When I delete the instance
    await item.delete();
    // Then the adapter gets called with an appropriate query
    expect(this.Item.adapter.delete).toHaveBeenCalledWith(this.Item, this._queryFor("delete"));
  }
}
