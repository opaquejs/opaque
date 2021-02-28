import { afterEach } from "@opaquejs/testing";

export class BaseTest {
  @afterEach()
  _resetMocks() {
    jest.restoreAllMocks();
  }
}
