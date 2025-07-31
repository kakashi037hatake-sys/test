/**
 * JSON Parsing Utilities
 *
 * Provides secure and robust JSON parsing utilities with detailed error handling
 * for audio processing operations.
 *
 * @format
 */

interface AudioAnalysisResult {
	format?: string;
	duration?: number;
	bitrate?: number;
	bpm?: number;
	key?: string;
	error?: string;
}

interface ParsedAudioResult {
	success: boolean;
	data?: AudioAnalysisResult;
	error?: string;
	rawOutput?: string;
}

/**
 * Safely parses JSON output from Python audio analysis scripts
 * @param rawOutput - The raw string output from Python script
 * @param context - Additional context for error logging (e.g., file path, operation type)
 * @returns Parsed result with success status and detailed error information
 */
export function parseAudioAnalysisJSON(
	rawOutput: string | null | undefined,
	context: string = "audio analysis"
): ParsedAudioResult {
	// Validate input type
	if (typeof rawOutput !== "string") {
		const error = `${context} returned invalid output format (expected string, got ${
			rawOutput === null ? "null" : typeof rawOutput
		})`;
		console.warn("Audio analysis returned invalid output format", {
			context,
			expectedType: "string",
			actualType: rawOutput === null ? "null" : typeof rawOutput,
			rawOutput,
		});
		return {
			success: false,
			error,
			rawOutput: rawOutput ?? "null or undefined",
		};
	}

	// Validate non-empty string
	if (rawOutput.trim().length === 0) {
		const error = `${context} returned empty output`;
		console.warn("Audio analysis returned empty output", { context });
		return {
			success: false,
			error,
			rawOutput,
		};
	}

	try {
		const parsed = JSON.parse(rawOutput);

		// Check if Python script returned an error
		if (parsed && typeof parsed === "object" && parsed.error) {
			const error = `${context} failed: ${parsed.error}`;
			console.error("Audio analysis script returned error", {
				context,
				scriptError: parsed.error,
			});
			return {
				success: false,
				error,
				rawOutput,
			};
		}

		// Validate that parsed JSON has expected structure
		if (typeof parsed !== "object" || parsed === null) {
			const error = `${context} returned invalid data structure (expected object, got ${typeof parsed})`;
			console.warn("Audio analysis returned invalid data structure", {
				context,
				expectedType: "object",
				actualType: typeof parsed,
				parsed,
			});
			return {
				success: false,
				error,
				rawOutput,
			};
		}

		return {
			success: true,
			data: parsed as AudioAnalysisResult,
		};
	} catch (e) {
		if (e instanceof SyntaxError) {
			const error = `Failed to parse ${context} JSON response: ${e.message}`;
			console.error("Failed to parse JSON response", {
				context,
				rawOutput,
				syntaxError: e.message,
			});
			return {
				success: false,
				error,
				rawOutput,
			};
		} else {
			const error = `Error processing ${context} results: ${
				e instanceof Error ? e.message : String(e)
			}`;
			console.error("Error processing analysis results", {
				context,
				rawOutput,
				error: e instanceof Error ? e.message : String(e),
			});
			return {
				success: false,
				error,
				rawOutput,
			};
		}
	}
}

/**
 * Creates a default audio info object for fallback scenarios
 */
export function createDefaultAudioInfo(): AudioAnalysisResult {
	return {
		duration: 0,
		bitrate: 0,
		bpm: 0,
		key: "Unknown",
		format: "unknown",
	};
}

/**
 * Validates that audio analysis result contains required fields
 */
export function validateAudioAnalysisResult(
	audioInfo: AudioAnalysisResult
): boolean {
	if (!audioInfo || typeof audioInfo !== "object") {
		return false;
	}

	// Check for required fields (at least format should be present)
	return typeof audioInfo.format === "string" && audioInfo.format.length > 0;
}

export type { AudioAnalysisResult, ParsedAudioResult };
