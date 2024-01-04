import { ValidateURL } from "@utilities/validateUrl.utils";
import { describe, it, expect } from "vitest";

describe("ValidateURL", () => {
	it("should return true for a valid URL", () => {
		expect(ValidateURL("https://www.example.com")).toBe(true);
	});

	it("should return false for an invalid URL", () => {
		expect(ValidateURL("invalid-url")).toBe(false);
	});

	it("should return false for an IP without http", () => {
		expect(ValidateURL("127.0.0.1:9980")).toBe(false);
	});

	it("should return true for an IP with http", () => {
		expect(ValidateURL("http://127.0.0.1:9980")).toBe(true);
	});

	it("should return true for a localhost", () => {
		expect(ValidateURL("localhost:9980")).toBe(true);
	});
});
