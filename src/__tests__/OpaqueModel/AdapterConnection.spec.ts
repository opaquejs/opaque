import factory from "../helpers/factory";
import { PrimaryKeyValue } from "../../contracts/ModelContracts";
import { BaseTest } from "../helpers/BaseTest";
import { ignore, runAsTest } from "@opaquejs/testing";

@runAsTest()
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
    expect(this.Item.adapter.insert).toHaveBeenCalledWith({ price: "12.90" });
  }

  async update() {
    // Given a persistent Item instance
    const item = this.Item.$fromRow({ id: "update", price: 12.9 });
    // When I save the price
    await item.save("price");
    // Then the adapter gets called with an appropriate query and the raw, serialized value
    expect(this.Item.adapter.update).toHaveBeenCalledWith(this._queryFor("update"), { price: "12.90" });
  }

  async delete() {
    // Given a persistent Item instance
    const item = this.Item.$fromRow({ id: "delete" });
    // When I delete the instance
    await item.delete();
    // Then the adapter gets called with an appropriate query
    expect(this.Item.adapter.delete).toHaveBeenCalledWith(this._queryFor("delete"));
  }
}

// test("reactive adapter compatible", async () => {
//   @boot()
//   class Model extends TestModel {
//     @attribute({
//       serialize: (date?: Date) => date?.toISOString(),
//       deserialize: (date: unknown) => (typeof date == "string" ? new Date(date) : undefined),
//     })
//     public serializing?: Date = undefined;
//   }
//   Model.$adapter.create = async () => ({
//     serializing: "2020-12-24T18:00:00",
//   });

//   const m = new Model();
//   await m.save();

//   m.$setRow({
//     serializing: "2020-12-24T12:00:00" as any,
//   });

//   expect(m.serializing).toBeInstanceOf(Date);
//   expect(m.serializing).toEqual(new Date("2020-12-24T12:00:00"));
// });
