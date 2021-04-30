import { AttributeOptionsContract, OpaqueTable } from "../../contracts/ModelContracts";
import { NoOpAdapter } from "../../NoOpAdapter";
import { OpaqueModel, staticImplements } from "../../Model";

class TestAdapter extends NoOpAdapter {
  public insert = jest.fn(super.insert);
  public update = jest.fn(super.update);
  public delete = jest.fn(super.delete);
  public read = jest.fn(super.read);
}

export const testQueryBuilder: any = {
  for: jest.fn((key: any) => testQueryBuilder),
  $getQuery: jest.fn(() => "query"),
};

@staticImplements<OpaqueTable>()
export class NoOpModel extends OpaqueModel {
  static adapter = new TestAdapter();
  static query() {
    return testQueryBuilder;
  }
}

class Factory {
  Model<T extends { [key: string]: any | Partial<AttributeOptionsContract<any>> }>(schema: T) {
    const Model = class extends NoOpModel {};
    for (const key in schema) {
      Model.$addAttribute(key, typeof schema[key] == "object" ? schema[key] : { default: schema[key] });
    }
    return Model as typeof NoOpModel &
      (new () => NoOpModel &
        {
          [Key in keyof T]: T[Key] extends Partial<AttributeOptionsContract<infer R>> ? R : T[Key];
        });
  }
}

export default new Factory();
