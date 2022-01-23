import { OpaqueTableInterface } from "./../contracts/ModelContracts";
import { BaseTest } from "./helpers/BaseTest";
import { runWithJest } from "@opaquejs/testing/lib/jest";
import { InMemoryAdapter } from "../InMemoryAdapter";
import { provide } from "@opaquejs/testing";
import { attribute, OpaqueModel } from "../Model";
import { inject } from "@opaquejs/testing";
import { QueryEngine } from "@opaquejs/query-engine";

class OpaqueTableInterfaceClass {}
const OpaqueTableInterface = OpaqueTableInterfaceClass;

@runWithJest()
@provide(InMemoryAdapter, () => new InMemoryAdapter(new QueryEngine({ mode: "sql" })))
@provide(OpaqueTableInterface, () => {
  const cla = class extends OpaqueModel {};
  cla.$addAttribute("id", { primaryKey: true });
  return cla;
})
export class InMemoryAdapterTest extends BaseTest {
  async insert(@inject() adapter: InMemoryAdapter, @inject(OpaqueTableInterface) Model: OpaqueTableInterface) {
    const data = { value: "data 1" };

    await adapter.insert(Model, data);

    // expect(await adapter.read(Model, {})).toContain(data);
  }
}
