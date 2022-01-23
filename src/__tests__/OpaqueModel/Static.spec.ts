import factory from "../helpers/factory";
import { runWithJest } from "@opaquejs/testing/lib/jest";

@runWithJest()
export class Static {
  async creating() {
    // Given a model with a title (default to 'title') and a description (default to 'description')
    const Model = factory.Model({ title: { primaryKey: true, default: "title" }, description: "description" });
    Model.make = jest.fn(Model.make);
    // When I create a new model with description set to 'custom'
    const model = await Model.create({ description: "custom" });
    // Then make got called and model is persistent
    expect(Model.make).toHaveBeenCalled();
    expect(model.$isPersistent).toBeTruthy();
  }
}
