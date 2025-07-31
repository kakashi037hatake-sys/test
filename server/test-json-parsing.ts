/**
 * Test script for JSON parsing utilities
 *
 * This script tests various scenarios for JSON parsing to ensure robust error handling.
 *
 * @format
 */

import {
	parseAudioAnalysisJSON,
	createDefaultAudioInfo,
	validateAudioAnalysisResult,
} from "./json-parsing-utils.js";

// Test cases
const testCases = [
	{
		name: "Valid JSON",
		input:
			'{"format": "mp3", "duration": 180, "bitrate": 320000, "bpm": 120, "key": "C major"}',
		expectedSuccess: true,
	},
	{
		name: "JSON with error field",
		input: '{"error": "File not found"}',
		expectedSuccess: false,
	},
	{
		name: "Invalid JSON syntax",
		input: '{"format": "mp3", "duration": 180, invalid}',
		expectedSuccess: false,
	},
	{
		name: "Empty string",
		input: "",
		expectedSuccess: false,
	},
	{
		name: "Non-string input",
		input: null,
		expectedSuccess: false,
	},
	{
		name: "Non-object JSON",
		input: '"just a string"',
		expectedSuccess: false,
	},
	{
		name: "Array JSON",
		input: "[1, 2, 3]",
		expectedSuccess: false,
	},
	{
		name: "Minimal valid audio info",
		input: '{"format": "wav"}',
		expectedSuccess: true,
	},
];

function runTests() {
	console.log("🧪 Testing JSON Parsing Utilities");
	console.log("=".repeat(50));

	let passed = 0;
	let failed = 0;

	testCases.forEach((testCase, index) => {
		console.log(`\nTest ${index + 1}: ${testCase.name}`);

		try {
			const result = parseAudioAnalysisJSON(testCase.input, testCase.name);

			if (result.success === testCase.expectedSuccess) {
				console.log("✅ PASS");
				passed++;

				if (result.success && result.data) {
					const isValid = validateAudioAnalysisResult(result.data);
					console.log(`   Data validation: ${isValid ? "✅" : "❌"}`);
					console.log(`   Data:`, result.data);
				} else if (!result.success) {
					console.log(`   Error: ${result.error}`);
				}
			} else {
				console.log("❌ FAIL");
				console.log(
					`   Expected success: ${testCase.expectedSuccess}, got: ${result.success}`
				);
				failed++;
			}
		} catch (error) {
			console.log("❌ FAIL (Exception thrown)");
			console.log(
				`   Error: ${error instanceof Error ? error.message : String(error)}`
			);
			failed++;
		}
	});

	console.log("\n" + "=".repeat(50));
	console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);

	// Test default audio info creation
	console.log("\n🔧 Testing default audio info creation:");
	const defaultInfo = createDefaultAudioInfo();
	console.log("Default audio info:", defaultInfo);
	console.log("Is valid:", validateAudioAnalysisResult(defaultInfo));

	return failed === 0;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	const success = runTests();
	process.exit(success ? 0 : 1);
}

export { runTests };
