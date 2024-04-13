import { browser, expect } from "@wdio/globals";

describe("VS Code Extension Testing", () => {
	it("should be able to load VSCode", async () => {
		const workbench = await browser.getWorkbench();
		expect(await workbench.getTitleBar().getTitle()).toContain("[Extension Development Host]");

		const myExtensionButton = await browser.$(`[aria-label="autokitteh"]`);
		await myExtensionButton.click();
		// Define and interact with the main panel or another significant element of your extension
		// Make sure this selector accurately points to the element you're testing
		const myExtensionPanel = await browser.$(`[aria-label="autokitteh: AK Server actions"]`); // Adjust the selector as needed

		// Example interaction or assertion
		const isVisible = await myExtensionPanel.isDisplayed();
		expect(isVisible).toBeTruthy();

		// Define the selector based on class and text content
		const buttonSelector = `a.monaco-button.monaco-text-button span`;

		// Use the selector to find the element
		const enableButton = await browser.$(buttonSelector);

		// Ensure the element's text matches 'Enable' before clicking
		const buttonText = await enableButton.getText();
		expect(buttonText).toEqual("Enable");

		// Ensure the button is displayed and enabled
		const isVisible2 = await enableButton.isDisplayed();
		expect(isVisible2).toBeTruthy();

		const isEnabled = await enableButton.isEnabled();
		expect(isEnabled).toBeTruthy();

		// Click on the button
		await enableButton.click();
		await browser.pause(500);

		const itemSelector = '[aria-label="Foolish_Hubert_0626"]';
		await browser.pause(500);

		// Use the selector to find the element
		const treeItem = await browser.$(itemSelector);
		await browser.pause(500);

		// Ensure the element is displayed
		const isVisible3 = await treeItem.isDisplayed();
		await browser.pause(500);

		expect(isVisible3).toBeTruthy();
		await browser.pause(500);

		// Optionally, interact with the element, such as clicking it or verifying more of its attributes
		await treeItem.click();
		await browser.pause(3000);

		const cssSelector = "#projectName";

		// Use the selector to find the element
		const textElement = await browser.$(cssSelector);

		// Get text and verify it
		const text = await textElement.getText();
		expect(text).toEqual("Foolish_Hubert_0626");

		const buildButton = await browser.$('vscode-button[title="Build"]');
		const isDisabled = await buildButton.getAttribute("disabled");

		// Check if 'disabled' attribute exists
		expect(isDisabled).not.toBeNull();
		await browser.pause(5000);
	});
});
