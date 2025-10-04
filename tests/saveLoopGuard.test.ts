import { describe, it, expect, beforeEach } from "vitest";

describe("Save Loop Guard", () => {
	let willSaveTriggerCount: Map<string, number>;
	let lastVersions: Map<string, number>;

	beforeEach(() => {
		willSaveTriggerCount = new Map();
		lastVersions = new Map();
	});

	const simulateWillSave = (key: string, currentVersion: number) => {
		const lastVersion = lastVersions.get(key);

		if (lastVersion !== undefined && currentVersion !== lastVersion) {
			const count = willSaveTriggerCount.get(key) || 0;
			if (count === 0) {
				willSaveTriggerCount.set(key, 1);
				lastVersions.set(key, currentVersion);
			} else {
				willSaveTriggerCount.delete(key);
			}
		} else {
			lastVersions.set(key, currentVersion);
		}
	};

	const simulateDidSave = (key: string) => {
		willSaveTriggerCount.delete(key);
		lastVersions.delete(key);
	};

	it("should allow at most one re-trigger after formatter edits", () => {
		const key = "file:///test.ts";

		simulateWillSave(key, 1);
		expect(willSaveTriggerCount.get(key)).toBeUndefined();
		expect(lastVersions.get(key)).toBe(1);

		simulateWillSave(key, 2);
		expect(willSaveTriggerCount.get(key)).toBe(1);
		expect(lastVersions.get(key)).toBe(2);

		simulateWillSave(key, 3);
		expect(willSaveTriggerCount.get(key)).toBeUndefined();
		expect(lastVersions.get(key)).toBe(2);

		simulateDidSave(key);
		expect(willSaveTriggerCount.get(key)).toBeUndefined();
		expect(lastVersions.get(key)).toBeUndefined();
	});

	it("should not re-trigger if version does not change", () => {
		const key = "file:///test.ts";

		simulateWillSave(key, 1);
		expect(willSaveTriggerCount.get(key)).toBeUndefined();

		simulateWillSave(key, 1);
		expect(willSaveTriggerCount.get(key)).toBeUndefined();
		expect(lastVersions.get(key)).toBe(1);
	});

	it("should reset state after save completes", () => {
		const key = "file:///test.ts";

		simulateWillSave(key, 1);
		simulateWillSave(key, 2);
		expect(willSaveTriggerCount.get(key)).toBe(1);

		simulateDidSave(key);
		expect(willSaveTriggerCount.get(key)).toBeUndefined();
		expect(lastVersions.get(key)).toBeUndefined();
	});
});
