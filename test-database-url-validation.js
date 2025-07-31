/**
 * Test Script: Enhanced PostgreSQL URL Validation
 *
 * This script demonstrates the improved regex pattern for validating PostgreSQL URLs
 * that now supports more legitimate URL formats while maintaining security.
 *
 * @format
 */

// Test function to validate PostgreSQL URLs (copy of the enhanced function)
function validateDatabaseUrl(url) {
	try {
		// Enhanced PostgreSQL connection string format validation
		const postgresUrlRegex =
			/^postgres(ql)?:\/\/[a-zA-Z0-9._~-]+:[^@\s]+@[a-zA-Z0-9._-]+:\d+\/[a-zA-Z0-9._~-]+(\?.*)?$/;

		if (!postgresUrlRegex.test(url)) {
			return {
				isValid: false,
				error:
					"Invalid DATABASE_URL format. Expected format: postgres://user:password@host:port/database",
			};
		}

		// Additional security checks (same as in storage.ts)
		if (url.includes("\n") || url.includes("\r") || url.includes("\t")) {
			return {
				isValid: false,
				error: "DATABASE_URL contains invalid characters",
			};
		}

		const suspiciousPatterns = [
			/;.*--/, // SQL comment injection
			/\bunion\s+select\b/i, // Union-based injection
			/\bselect\b/i, // Select statement injection
			/\bdrop\b/i, // Drop statement injection
			/\binsert\b/i, // Insert statement injection
			/\bdelete\b/i, // Delete statement injection
			/\bupdate\b/i, // Update statement injection
		];

		for (const pattern of suspiciousPatterns) {
			if (pattern.test(url)) {
				return {
					isValid: false,
					error: "DATABASE_URL contains potentially malicious content",
				};
			}
		}

		return { isValid: true };
	} catch (error) {
		return {
			isValid: false,
			error: `Validation error: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		};
	}
}

// Test cases demonstrating the enhancement
const testCases = [
	// Current working URL
	{
		name: "Current Database URL",
		url: "postgresql://postgres:7372@localhost:5432/airemixer",
		expectedValid: true,
		description: "Current configuration (should work)",
	},

	// URLs that would fail with old regex but pass with new one
	{
		name: "Username with Dots",
		url: "postgresql://user.name:password@localhost:5432/database",
		expectedValid: true,
		description: "Username containing dots (now supported)",
	},
	{
		name: "Database with Dots",
		url: "postgresql://user:password@localhost:5432/my.database",
		expectedValid: true,
		description: "Database name with dots (now supported)",
	},
	{
		name: "Username with Tilde",
		url: "postgresql://user~name:password@localhost:5432/database",
		expectedValid: true,
		description: "Username with tilde character (now supported)",
	},
	{
		name: "Host with Underscores",
		url: "postgresql://user:password@db_server.example.com:5432/database",
		expectedValid: true,
		description: "Hostname with underscores (now supported)",
	},
	{
		name: "Complex Valid URL",
		url: "postgresql://my.user_name:complex.pass~word@db-server.example.com:5432/my_database.prod?sslmode=require",
		expectedValid: true,
		description: "Complex but valid URL with various allowed characters",
	},

	// URLs that should still fail (security)
	{
		name: "SQL Injection Attempt",
		url: "postgresql://user:password@localhost:5432/db;DROP TABLE users--",
		expectedValid: false,
		description: "SQL injection attempt (should be blocked)",
	},
	{
		name: "Path Traversal",
		url: "postgresql://user:password@localhost:5432/../../../etc/passwd",
		expectedValid: false,
		description: "Path traversal attempt (should be blocked)",
	},
	{
		name: "Invalid Characters",
		url: "postgresql://user:password@localhost:5432/database\nmalicious",
		expectedValid: false,
		description: "Newline character injection (should be blocked)",
	},
	{
		name: "Missing Database",
		url: "postgresql://user:password@localhost:5432/",
		expectedValid: false,
		description: "Missing database name (should be blocked)",
	},
	{
		name: "Invalid Port",
		url: "postgresql://user:password@localhost:abc/database",
		expectedValid: false,
		description: "Non-numeric port (should be blocked)",
	},
];

console.log("🔒 Enhanced PostgreSQL URL Validation Test");
console.log("═".repeat(60));
console.log();

let passedTests = 0;
let totalTests = testCases.length;

for (const testCase of testCases) {
	const result = validateDatabaseUrl(testCase.url);
	const success = result.isValid === testCase.expectedValid;

	console.log(`${success ? "✅" : "❌"} ${testCase.name}`);
	console.log(`   Description: ${testCase.description}`);
	console.log(`   URL: ${testCase.url}`);
	console.log(`   Expected: ${testCase.expectedValid ? "VALID" : "INVALID"}`);
	console.log(`   Result: ${result.isValid ? "VALID" : "INVALID"}`);

	if (!success) {
		console.log(
			`   ⚠️  Test failed! Expected ${testCase.expectedValid}, got ${result.isValid}`
		);
	}

	if (!result.isValid && result.error) {
		console.log(`   Error: ${result.error}`);
	}

	console.log();

	if (success) passedTests++;
}

console.log("📊 Test Results Summary");
console.log("─".repeat(30));
console.log(`✅ Passed: ${passedTests}/${totalTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
console.log(
	`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`
);

if (passedTests === totalTests) {
	console.log(
		"\n🎉 All tests passed! Enhanced regex validation is working correctly."
	);
} else {
	console.log("\n⚠️  Some tests failed. Please review the implementation.");
}

console.log("\n📋 Enhancement Summary:");
console.log("- Added support for dots (.) in usernames and database names");
console.log("- Added support for tilde (~) characters");
console.log("- Added support for underscores (_) in hostnames");
console.log("- Maintained security against injection attacks");
console.log("- Preserved backward compatibility with existing URLs");
