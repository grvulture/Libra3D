jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ get: jest.fn() })),
  },
}));

describe("auth request deduplication", () => {
  beforeEach(() => {
    const { resetCurrentUserRequest } = require("./auth");
    resetCurrentUserRequest();
  });

  it("shares one in-flight request", async () => {
    const axios = require("axios");
    const get = jest.fn();
    axios.default.create.mockReturnValue({ get });

    const { fetchCurrentUser } = require("./auth");
    let resolveRequest;
    get.mockReturnValue(new Promise((resolve) => {
      resolveRequest = resolve;
    }));

    const first = fetchCurrentUser();
    const second = fetchCurrentUser();
    expect(first).toBe(second);
    expect(get).toHaveBeenCalledTimes(1);

    resolveRequest({ data: { id: "user-1" } });
    await expect(first).resolves.toEqual({ id: "user-1" });

    const third = fetchCurrentUser();
    expect(get).toHaveBeenCalledTimes(2);
    resolveRequest({ data: { id: "user-2" } });
    await third;
  });
});
