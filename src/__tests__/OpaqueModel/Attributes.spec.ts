import { GetAttributeOptions, SetAttributeOptions } from "../../contracts/ModelContracts";
import factory, { NoOpModel } from "../helpers/factory";
import { attribute } from "../../Model";
import { Example, example, inject } from "@opaquejs/testing";
import { runWithJest } from "@opaquejs/testing/lib/jest";

@runWithJest()
export class Attributes {
  defaultAttributesAreSet() {
    // Given a model with a title (default to 'title') and a description (default to 'description')
    const Model = factory.Model({ title: "title", description: "description" });
    // When I make a new model with description set to 'custom'
    const model = Model.make({ description: "custom" });
    // Then the title is 'title' and the dscription 'custom'
    expect(model.title).toBe("title");
    expect(model.description).toBe("custom");
  }

  attributeReflectsChanges() {
    // Given a model instance with a title set to 'default'
    const model = factory.Model({ title: "default" }).make();
    // When I change title to 'changed'
    model.title = "changed";
    // Then title should be 'changed'
    expect(model.title).toBe("changed");
  }

  @example({}, "3€")
  @example({ raw: true }, "3")
  getterWorks(@inject() options: Example<GetAttributeOptions>, @inject() result: Example<string>) {
    // Given an item with the price attribute with a getter appending '€'
    const item = factory
      .Model({
        price: { get: (value: string) => `${value}€` },
        default: "",
      })
      .make();
    // When i set price to '3'
    item.price = "3";
    // Then getting price should return <result>
    expect(item.$getAttribute("price", options)).toBe(result);
  }
  @example({}, "3")
  @example({ raw: true }, "3€")
  setterWorks(@inject() options: Example<SetAttributeOptions>, @inject() result: Example<string>) {
    // Given an item with the price attribute with a setter removing '€'
    const item = factory
      .Model({
        price: { set: (value: string) => value.replace("€", "") },
        default: "",
      })
      .make();
    // When i set price to '3€' and <options>
    item.$setAttribute("price", "3€", options);
    // Then getting price should return <result>
    expect(item.price).toBe(result);
  }
  resetAllCallsResetOnly() {
    // Given a model with a title (default to 'title') and description (default to 'description')
    const Model = factory.Model({
      title: "title",
      description: "description",
    });
    // When I create a model and reset it
    const model = Model.make();
    // Then the $resetOnly method should have been called with ['title', and 'description']
    const spy = jest.spyOn(model, "$resetOnly");
    model.reset();
    expect(spy).toHaveBeenCalledWith(["title", "description"]);
  }
  resetOnlyResetsOnlyWantedFields() {
    // Given a model with a title 'custom' (default to 'title') and description 'custom' (default to 'description')
    const model = factory
      .Model({
        title: "title",
        description: "description",
      })
      .make({ title: "custom", description: "custom" });
    // When I reset the title
    model.reset("title");
    // Then the model should match {title: 'title', description: 'custom'}
    expect(model.$getAttributes()).toEqual({ title: "title", description: "custom" });
  }
  extendingWorks() {
    // Given a parent model with {title: 'title'}
    class Parent extends NoOpModel {
      @attribute()
      public title: string = "title";
    }
    // When I extend parent model with model {description: 'description'}
    class Child extends Parent {
      @attribute()
      public description: string = "description";
    }
    // Then child schema should contain keys 'title' and 'description'
    expect(Child.$schema.has("title")).toBeTruthy();
    expect(Child.$schema.has("description")).toBeTruthy();
  }
  serializingWorks() {
    // Given a model with a string id serializing to a number
    const model = factory
      .Model({
        id: {
          default: "0",
          serialize: (value: string) => Number.parseInt(value),
        },
      })
      .make({ id: "12" });
    // When I serialize it
    const data = model.$serialize();
    // Then the id should be a number
    expect(typeof data.id).toBe("number");
  }
  deserializingWorks() {
    // Given a model with a string id deserializing from a number
    const Model = factory.Model({
      id: {
        default: 0,
        deserialize: (value: unknown) => `${value}`,
      },
    });
    // When I create a model from a row with a number as an id
    const model = Model.$fromRow({ id: 12 });
    // Then the id should be a string
    expect(typeof model.id).toBe("string");
  }

  usesLastPrimaryKey() {
    // Given a model with a primary key
    const Model = factory.Model({ id1: { primaryKey: true }, id2: { primaryKey: true } });
    // When I add another primary key
    Model.$addAttribute("id2", { primaryKey: true });
    // Then I get the last defined attribute as primaryKey
    expect(Model.primaryKey).toBe("id2");
  }
  throwsErrorWithoutPrimaryKey() {
    // Given a model with no primary key
    const Model = factory.Model({});
    // When I get the primary key
    const func = () => Model.primaryKey;
    // Then I get thrown an error
    expect(func).toThrow();
  }
  isPersistentReturnsFalseIfNoStorageIsSet() {
    // Given a non-persistent model instance
    const model = factory.Model({}).make({});
    // When I get $isPersistent
    // Then I get false
    expect(model.$isPersistent).toBeFalsy();
  }
  isPersistentReturnsTrueIfStorageIsSet() {
    // Given a persistent model instance
    const model = factory.Model({}).$fromRow({});
    // When I get $isPersistent
    // Then I get true
    expect(model.$isPersistent).toBeTruthy();
  }
  instanceSchemaReturnsTheSameAsConstructorSchema() {
    // Given a model instance
    const model = factory.Model({}).make({});
    // When I mock the constructor $schame to return 'schema'
    Object.defineProperty(model.constructor, "$schema", {
      get: () => "schema",
    });
    // Then I get 'schema' from instance.$schema
    expect(model.$schema).toBe("schema");
  }
  primaryKeyValueGetter() {
    // Given a model instance with a primary key set to 'pk-value'
    const model = factory.Model({ id: { primaryKey: true } }).make({ id: "pk-value" });
    // When I get the instance primaryKeyValue property
    // Then I get 'pk-value'
    expect(model.$primaryKeyValue).toBe("pk-value");
  }
  primaryKeyValueSetter() {
    // Given a model instance with a primary key set to 'pk-value'
    const model = factory.Model({ id: { primaryKey: true } }).make({ id: "pk-value" });
    // When I set the instance primaryKeyValue property to 'pk-value-2'
    model.$primaryKeyValue = "pk-value-2";
    // Then primaryKey attribute returns 'pk-value'
    expect(model.id).toBe("pk-value-2");
  }
  getAndSetAttributes() {
    // Given a model instance
    const model = factory.Model({ id: {}, name: {} }).make();
    // When I set id to 'id value' and a name to 'name value'
    model.$setAttributes({ id: "id value", name: "name value" });
    // Then $getAttributes returns {id: 'id value', name: 'name value'}
    expect(model.$getAttributes()).toEqual({ id: "id value", name: "name value" });
  }

  async findCallsQueryFind() {
    // Given a Model
    const querybuilder = {
      for: jest.fn(function (this: any) {
        return this;
      }),
      first: jest.fn(() => "model"),
    };
    class Model extends NoOpModel {
      static query() {
        return querybuilder as any;
      }
    }
    // When I call find on that Model
    const result = await Model.find("something");
    // Then the queries find and for method got called
    expect(querybuilder.for).toHaveBeenCalledWith("something");
    expect(querybuilder.first).toHaveBeenCalled();
    expect(result).toBe("model");
  }

  async insertKeepsAttributes() {
    const Model = await factory.Model({ id: { primaryKey: true, default: "" } });
    const model = await Model.create({ id: "here" });
    expect(model.id).toBe("here");
  }
  async updateKeepsAttributes() {
    const model = await factory.Model({ id: { primaryKey: true, default: "" } }).create({ id: "here" });
    await model.$setAndSaveAttributes({ id: "again" });
    expect(model.id).toBe("again");
  }

  async saveWithNoArgsCallsSaveAll() {
    // Given a model instance
    const model = factory.Model({ id: { primaryKey: true, default: "some-id" } }).make();
    model.$saveAll = jest.fn(model.$saveAll);
    // When I call save without arguments
    await model.save();
    // Then $saveAll got called
    expect(model.$saveAll).toHaveBeenCalled();
  }
  async setAndSaveAttributesCallsBothMethods() {
    // Given a model instance
    const model = factory.Model({ test: { primaryKey: true, default: false } }).make();
    model.$saveOnly = jest.fn(model.$saveOnly);
    model.$setAttributes = jest.fn(model.$setAttributes);
    // When I call setAndSaveAll with {test: true}
    await model.$setAndSaveAttributes({ test: true });
    // Then $saveOnly and $setAttributes got called
    expect(model.$saveOnly).toHaveBeenCalledWith(["test"]);
    expect(model.$setAttributes).toHaveBeenCalledWith({ test: true });
  }
}
