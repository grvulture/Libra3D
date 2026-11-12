import fs from "fs";
import path from "path";

test("checkout does not collect or submit card data", () => {
  const source = fs.readFileSync(path.join(__dirname, "Checkout.jsx"), "utf8");
  expect(source).not.toMatch(/checkout-card|checkout-exp|checkout-cvc/);
  expect(source).not.toMatch(/card:|exp:|cvc:/);
  expect(source).not.toMatch(/cardNumber|card_number|cvc/i);
});
