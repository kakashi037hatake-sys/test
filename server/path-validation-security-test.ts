/**
 * Security Test Suite for Path Validation
 *
 * This file demonstrates the improved security of the validateFilePath function
 * and how it prevents various path traversal attack vectors.
 *
 * @format
 */

import path from "path";

// Copy of the improved validateFilePath function for testing
function validateFilePath(filePath: string, allowedDirectory: string): boolean {
	try {
		// Sanitize inputs first
		const sanitizedFilePath = filePath
			.replace(/[<>:"|?*]/g, "")
			.normalize("NFC");
		const sanitizedAllowedDir = allowedDirectory
			.replace(/[<>:"|?*]/g, "")
			.normalize("NFC");

		// Check for obvious path traversal patterns
		if (sanitizedFilePath.includes("..") || sanitizedFilePath.includes("\0")) {
			return false;
		}

		const resolvedFilePath = path.resolve(sanitizedFilePath); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
		const resolvedAllowedDir = path.resolve(sanitizedAllowedDir); // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal

		// Use path.relative() for secure boundary validation
		const relativePath = path.relative(resolvedAllowedDir, resolvedFilePath);

		// Ensure the resolved path is within the allowed directory
		// - relativePath should not start with ".." (would indicate escape)
		// - relativePath should not be an absolute path
		// - Empty string means filePath === allowedDirectory
		return !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
	} catch (error) {
		console.error("Path validation error:", error);
		return false;
	}
}

// Security test cases
const testCases = [
	// Valid cases (should return true)
	{
		name: "Valid file in uploads directory",
		filePath: "/app/uploads/file.txt",
		allowedDir: "/app/uploads",
		expected: true,
		description: "Normal file within allowed directory",
	},
	{
		name: "Valid subdirectory file",
		filePath: "/app/uploads/subdir/file.txt",
		allowedDir: "/app/uploads",
		expected: true,
		description: "File in subdirectory within allowed directory",
	},
	{
		name: "Same directory",
		filePath: "/app/uploads",
		allowedDir: "/app/uploads",
		expected: true,
		description: "Path equals allowed directory",
	},

	// Invalid cases (should return false)
	{
		name: "Classic path traversal",
		filePath: "/app/uploads/../../../etc/passwd",
		allowedDir: "/app/uploads",
		expected: false,
		description: "Classic directory traversal attack",
	},
	{
		name: "Encoded path traversal",
		filePath: "/app/uploads/%2e%2e/%2e%2e/etc/passwd",
		allowedDir: "/app/uploads",
		expected: false,
		description: "URL-encoded path traversal",
	},
	{
		name: "Unicode path traversal",
		filePath: "/app/uploads/\u002e\u002e/\u002e\u002e/etc/passwd",
		allowedDir: "/app/uploads",
		expected: false,
		description: "Unicode-encoded path traversal",
	},
	{
		name: "Null byte injection",
		filePath: "/app/uploads/file.txt\u0000../../etc/passwd",
		allowedDir: "/app/uploads",
		expected: false,
		description: "Null byte injection attack",
	},
	{
		name: "Absolute path escape",
		filePath: "/etc/passwd",
		allowedDir: "/app/uploads",
		expected: false,
		description: "Direct absolute path outside allowed directory",
	},
	{
		name: "Relative parent escape",
		filePath: "../../etc/passwd",
		allowedDir: "/app/uploads",
		expected: false,
		description: "Relative path escaping to parent directories",
	},
	{
		name: "Windows path traversal",
		filePath: "/app/uploads/..\\..\\windows\\system32\\cmd.exe",
		allowedDir: "/app/uploads",
		expected: false,
		description: "Windows-style path traversal",
	},
	{
		name: "Mixed separators",
		filePath: "/app/uploads/../..\\etc/passwd",
		allowedDir: "/app/uploads",
		expected: false,
		description: "Mixed path separators for traversal",
	},
];

// Run security tests
console.log("=== Path Validation Security Tests ===\n");

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
	const result = validateFilePath(testCase.filePath, testCase.allowedDir);
	const success = result === testCase.expected;

	console.log(`${success ? "✅" : "❌"} ${testCase.name}`);
	console.log(`   Path: ${testCase.filePath}`);
	console.log(`   Expected: ${testCase.expected}, Got: ${result}`);
	console.log(`   Description: ${testCase.description}`);

	if (!success) {
		console.log(`   ⚠️  SECURITY ISSUE: Test failed!`);
		failed++;
	} else {
		passed++;
	}

	console.log();
});

console.log(`=== Test Results ===`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📊 Total: ${testCases.length}`);

if (failed === 0) {
	console.log(
		`🎉 All security tests passed! Path validation is working correctly.`
	);
} else {
	console.log(
		`⚠️  ${failed} security tests failed. Path validation needs improvement.`
	);
}

// Demonstration of path.relative() behavior
console.log(`\n=== path.relative() Security Analysis ===`);

const examples = [
	{ base: "/app/uploads", target: "/app/uploads/file.txt" },
	{ base: "/app/uploads", target: "/app/uploads/../etc/passwd" },
	{ base: "/app/uploads", target: "/etc/passwd" },
	{ base: "/app/uploads", target: "/app/uploads" },
];

examples.forEach((example) => {
	const relative = path.relative(example.base, example.target);
	const isSecure = !relative.startsWith("..") && !path.isAbsolute(relative);

	console.log(`Base: ${example.base}`);
	console.log(`Target: ${example.target}`);
	console.log(`Relative: "${relative}"`);
	console.log(`Secure: ${isSecure ? "✅" : "❌"}`);
	console.log();
});

export { validateFilePath };
