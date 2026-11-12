import { fetchProducts, fetchProduct, API_BASE_URL } from "./products";

describe("products API", () => {
  it("uses a local default base URL instead of a hardcoded production URL", () => {
    expect(API_BASE_URL).toBe("http://localhost:8000");
  });

  it("exports request helpers", () => {
    expect(typeof fetchProducts).toBe("function");
    expect(typeof fetchProduct).toBe("function");
  });
});
