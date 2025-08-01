/**
 * Security Test Suite for Database URL Validation
 *
 * This file demonstrates the security validation for DATABASE_URL
 * and how it prevents various connection string injection attacks.
 *
 * @format
 */

/**
 * Validates DATABASE_URL format to prevent connection string injection attacks
 * Ensures the URL follows expected PostgreSQL connection string format
 */
function validateDatabaseUrl(url: string): void {
	// PostgreSQL connection string format validation
	// Format: postgres://user:password@host:port/database
	// Also supports postgresql:// scheme and additional query parameters
	const postgresUrlRegex =
		/^postgres(ql)?:\/\/[a-zA-Z0-9_.-]+:[^@\s]+@[a-zA-Z0-9.-]+:\d+\/[a-zA-Z0-9_-]+(\?.*)?$/;

	if (!postgresUrlRegex.test(url)) {
		throw new Error(
			"Invalid DATABASE_URL format. Expected format: postgres://user:password@host:port/database"
		);
	}

	// Additional security checks
	if (url.includes("\n") || url.includes("\r") || url.includes("\t")) {
		throw new Error("DATABASE_URL contains invalid characters");
	}

	// Check for suspicious patterns that might indicate injection attempts
	const suspiciousPatterns = [
		/;.*--/, // SQL comment injection
		/\bunion\b/i, // Union-based injection
		/\bselect\b/i, // Select statement injection
		/\bdrop\b/i, // Drop statement injection
		/\binsert\b/i, // Insert statement injection
		/\bdelete\b/i, // Delete statement injection
		/\bupdate\b/i, // Update statement injection
	];

	for (const pattern of suspiciousPatterns) {
		if (pattern.test(url)) {
			throw new Error("DATABASE_URL contains potentially malicious content");
		}
	}
}

// Security test cases
const testCases = [
	// Valid cases (should pass)
	{
		name: "Valid PostgreSQL URL",
		url: "postgres://user:password@localhost:5432/database",
		expected: true,
		description: "Standard PostgreSQL connection string",
	},
	{
		name: "Valid PostgreSQL URL with postgresql scheme",
		url: "postgresql://user:password@localhost:5432/database",
		expected: true,
		description: "Alternative PostgreSQL scheme",
	},
	{
		name: "Valid URL with query parameters",
		url: "postgres://user:password@localhost:5432/database?sslmode=require",
		expected: true,
		description: "PostgreSQL URL with SSL configuration",
	},
	{
		name: "Valid URL with complex password",
		url: "postgres://user:P@ssw0rd123@localhost:5432/database",
		expected: true,
		description: "URL with special characters in password",
	},
	{
		name: "Valid URL with domain hostname",
		url: "postgres://user:password@db.example.com:5432/myapp",
		expected: true,
		description: "URL with domain name instead of localhost",
	},
	{
		name: "Valid URL with IP address",
		url: "postgres://user:password@192.168.1.100:5432/database",
		expected: true,
		description: "URL with IP address",
	},
	{
		name: "Valid URL with underscores and hyphens",
		url: "postgres://my_user:password@db-server.local:5432/my_database",
		expected: true,
		description: "URL with underscores and hyphens in names",
	},

	// Invalid cases (should fail)
	{
		name: "Missing scheme",
		url: "user:password@localhost:5432/database",
		expected: false,
		description: "URL without postgres:// scheme",
	},
	{
		name: "Wrong scheme",
		url: "mysql://user:password@localhost:5432/database",
		expected: false,
		description: "Non-PostgreSQL database scheme",
	},
	{
		name: "Missing password",
		url: "postgres://user@localhost:5432/database",
		expected: false,
		description: "URL without password",
	},
	{
		name: "Missing port",
		url: "postgres://user:password@localhost/database",
		expected: false,
		description: "URL without port number",
	},
	{
		name: "Invalid port",
		url: "postgres://user:password@localhost:abc/database",
		expected: false,
		description: "URL with non-numeric port",
	},
	{
		name: "Missing database name",
		url: "postgres://user:password@localhost:5432/",
		expected: false,
		description: "URL without database name",
	},
	{
		name: "SQL injection in username",
		url: "postgres://user';DROP TABLE users;--:password@localhost:5432/database",
		expected: false,
		description: "SQL injection attempt in username",
	},
	{
		name: "SQL injection in password",
		url: "postgres://user:password';DROP DATABASE;--@localhost:5432/database",
		expected: false,
		description: "SQL injection attempt in password",
	},
	{
		name: "SQL injection in hostname",
		url: "postgres://user:password@localhost';DROP TABLE users;--:5432/database",
		expected: false,
		description: "SQL injection attempt in hostname",
	},
	{
		name: "SQL injection in database name",
		url: "postgres://user:password@localhost:5432/database';DROP TABLE users;--",
		expected: false,
		description: "SQL injection attempt in database name",
	},
	{
		name: "Union-based injection",
		url: "postgres://user:password@localhost:5432/database UNION SELECT * FROM users",
		expected: false,
		description: "Union-based SQL injection attempt",
	},
	{
		name: "Select statement injection",
		url: "postgres://user:password@localhost:5432/database; SELECT * FROM users",
		expected: false,
		description: "Select statement injection attempt",
	},
	{
		name: "Drop statement injection",
		url: "postgres://user:password@localhost:5432/database; DROP TABLE users",
		expected: false,
		description: "Drop statement injection attempt",
	},
	{
		name: "Newline injection",
		url: "postgres://user:password@localhost:5432/database\nDROP TABLE users;",
		expected: false,
		description: "Newline character injection",
	},
	{
		name: "Carriage return injection",
		url: "postgres://user:password@localhost:5432/database\rDROP TABLE users;",
		expected: false,
		description: "Carriage return character injection",
	},
	{
		name: "Tab injection",
		url: "postgres://user:password@localhost:5432/database\tDROP TABLE users;",
		expected: false,
		description: "Tab character injection",
	},
	{
		name: "Comment injection",
		url: "postgres://user:password@localhost:5432/database;--comment",
		expected: false,
		description: "SQL comment injection attempt",
	},
	{
		name: "Insert injection",
		url: "postgres://user:password@localhost:5432/database; INSERT INTO users VALUES ('hacker', 'password')",
		expected: false,
		description: "Insert statement injection attempt",
	},
	{
		name: "Update injection",
		url: "postgres://user:password@localhost:5432/database; UPDATE users SET admin=true",
		expected: false,
		description: "Update statement injection attempt",
	},
	{
		name: "Delete injection",
		url: "postgres://user:password@localhost:5432/database; DELETE FROM users",
		expected: false,
		description: "Delete statement injection attempt",
	},
	{
		name: "Empty string",
		url: "",
		expected: false,
		description: "Empty database URL",
	},
	{
		name: "Spaces in URL",
		url: "postgres://user:password@localhost :5432/database",
		expected: false,
		description: "URL with spaces",
	},
];

// Run security tests
console.log("=== Database URL Security Validation Tests ===\n");

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
	let result: boolean;
	try {
		validateDatabaseUrl(testCase.url);
		result = true;
	} catch (error) {
		// Error expected for invalid URLs
		console.debug("Expected error for invalid URL:", error);
		result = false;
	}

	const success = result === testCase.expected;

	console.log(`${success ? "✅" : "❌"} ${testCase.name}`);
	console.log(
		`   URL: ${testCase.url.substring(0, 100)}${
			testCase.url.length > 100 ? "..." : ""
		}`
	);
	console.log(
		`   Expected: ${testCase.expected ? "PASS" : "FAIL"}, Got: ${
			result ? "PASS" : "FAIL"
		}`
	);
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
		`🎉 All security tests passed! Database URL validation is working correctly.`
	);
} else {
	console.log(
		`⚠️  ${failed} security tests failed. Database URL validation needs improvement.`
	);
}

// Demonstration of regex patterns
console.log(`\n=== Security Pattern Analysis ===`);

const securityPatterns = [
	{ name: "SQL Comment", pattern: /;.*--/, example: "database;--comment" },
	{
		name: "Union Injection",
		pattern: /\bunion\b/i,
		example: "database UNION SELECT",
	},
	{
		name: "Select Injection",
		pattern: /\bselect\b/i,
		example: "database SELECT *",
	},
	{
		name: "Drop Injection",
		pattern: /\bdrop\b/i,
		example: "database DROP TABLE",
	},
	{
		name: "Insert Injection",
		pattern: /\binsert\b/i,
		example: "database INSERT INTO",
	},
	{
		name: "Delete Injection",
		pattern: /\bdelete\b/i,
		example: "database DELETE FROM",
	},
	{
		name: "Update Injection",
		pattern: /\bupdate\b/i,
		example: "database UPDATE users",
	},
];

securityPatterns.forEach((patternInfo) => {
	const matches = patternInfo.pattern.test(patternInfo.example);
	console.log(`${patternInfo.name}: ${matches ? "🚨 DETECTED" : "✅ Safe"}`);
	console.log(`   Pattern: ${patternInfo.pattern}`);
	console.log(`   Example: ${patternInfo.example}`);
	console.log();
});

export { validateDatabaseUrl };
