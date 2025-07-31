/**
 * Secure File Cleanup Utilities
 *
 * Provides safe file cleanup methods that avoid security vulnerabilities
 * associated with wildcard patterns and unsanitized file operations.
 *
 * @format
 */

import { promises as fs } from "fs";
import path from "path";

export interface CleanupResult {
	success: boolean;
	filesRemoved: number;
	errors: string[];
}

export interface CleanupOptions {
	/** Only remove files with this prefix */
	prefix?: string;
	/** Only remove files with these extensions */
	allowedExtensions?: string[];
	/** Maximum age of files to remove (in milliseconds) */
	maxAge?: number;
	/** Whether to log detailed cleanup operations */
	verbose?: boolean;
}

/**
 * Securely clean up files in a directory by prefix
 * This method validates each file individually instead of using wildcards
 */
export async function cleanupFilesByPrefix(
	directory: string,
	prefix: string,
	options: CleanupOptions = {}
): Promise<CleanupResult> {
	const result: CleanupResult = {
		success: true,
		filesRemoved: 0,
		errors: [],
	};

	try {
		// Sanitize and validate directory input
		const sanitizedDirectory = directory
			.replace(/[<>:"|?*]/g, "")
			.normalize("NFC");
		const resolvedDir = path.resolve(sanitizedDirectory);

		// Ensure we're working within expected boundaries
		const projectRoot = path.resolve(process.cwd());
		if (!resolvedDir.startsWith(projectRoot)) {
			result.success = false;
			result.errors.push("Directory outside project boundaries");
			return result;
		}

		const files = await fs.readdir(resolvedDir);
		const matchingFiles = files.filter((file) => {
			// Sanitize filename and validate it doesn't contain path traversal
			const sanitizedFile = file.replace(/[<>:"|?*]/g, "").normalize("NFC");
			if (
				sanitizedFile.includes("..") ||
				sanitizedFile.includes("/") ||
				sanitizedFile.includes("\\")
			) {
				return false;
			}

			// Basic prefix check
			if (!sanitizedFile.startsWith(prefix)) {
				return false;
			}

			// Extension check if specified
			if (options.allowedExtensions) {
				const ext = path.extname(sanitizedFile).toLowerCase();
				if (!options.allowedExtensions.includes(ext)) {
					return false;
				}
			}

			return true;
		});

		for (const file of matchingFiles) {
			// Double-check file doesn't contain path traversal before joining
			const sanitizedFile = file.replace(/[<>:"|?*]/g, "").normalize("NFC");
			if (
				sanitizedFile.includes("..") ||
				sanitizedFile.includes("/") ||
				sanitizedFile.includes("\\")
			) {
				result.errors.push(`Skipped potentially unsafe filename: ${file}`);
				continue;
			}

			const filePath = path.join(resolvedDir, sanitizedFile);

			try {
				// Additional age check if specified
				if (options.maxAge) {
					const stats = await fs.stat(filePath);
					const fileAge = Date.now() - stats.mtime.getTime();
					if (fileAge < options.maxAge) {
						continue; // Skip files that are too new
					}
				}

				await fs.unlink(filePath);
				result.filesRemoved++;

				if (options.verbose) {
					console.log("Successfully cleaned up file", { filePath });
				}
			} catch (error) {
				const errorMessage = `Failed to delete ${filePath}: ${
					error instanceof Error ? error.message : String(error)
				}`;
				result.errors.push(errorMessage);

				if (options.verbose) {
					console.warn("File cleanup error", {
						filePath,
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		}

		if (options.verbose && result.filesRemoved > 0) {
			console.log("Cleanup completed", {
				directory: resolvedDir,
				prefix,
				filesRemoved: result.filesRemoved,
				errors: result.errors.length,
			});
		}
	} catch (error) {
		result.success = false;
		const errorMessage = `Error reading directory ${directory}: ${
			error instanceof Error ? error.message : String(error)
		}`;
		result.errors.push(errorMessage);

		console.error("Error during batch cleanup", {
			directory,
			prefix,
			error: error instanceof Error ? error.message : String(error),
		});
	}

	return result;
}

/**
 * Securely clean up a single file with validation
 */
export async function cleanupSingleFile(filePath: string): Promise<boolean> {
	try {
		// Sanitize and validate file path input
		const sanitizedPath = filePath.replace(/[<>:"|?*]/g, "").normalize("NFC");

		// Check for path traversal attempts
		if (sanitizedPath.includes("..") || sanitizedPath.includes("//")) {
			console.warn("Attempted path traversal in file cleanup", {
				originalPath: filePath,
				sanitizedPath,
			});
			return false;
		}

		// Validate file path
		const resolvedPath = path.resolve(sanitizedPath);

		// Ensure we're working within expected boundaries
		const projectRoot = path.resolve(process.cwd());
		if (!resolvedPath.startsWith(projectRoot)) {
			console.warn("Attempted to cleanup file outside project boundaries", {
				filePath: resolvedPath,
				projectRoot,
			});
			return false;
		}

		await fs.unlink(resolvedPath);
		return true;
	} catch (error) {
		console.warn("Failed to cleanup file", {
			filePath,
			error: error instanceof Error ? error.message : String(error),
		});
		return false;
	}
}

/**
 * Clean up temporary upload files safely
 */
export async function cleanupUploadFiles(
	uploadsDir: string,
	uploadId: string
): Promise<CleanupResult> {
	return cleanupFilesByPrefix(uploadsDir, `${uploadId}_`, {
		allowedExtensions: [
			".tmp",
			".part",
			".mp3",
			".wav",
			".flac",
			".aiff",
			".m4a",
		],
		verbose: true,
	});
}

/**
 * Clean up old temporary files based on age
 */
export async function cleanupOldTempFiles(
	tempDir: string,
	maxAgeHours: number = 24
): Promise<CleanupResult> {
	const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds

	return cleanupFilesByPrefix(tempDir, "", {
		allowedExtensions: [".tmp", ".part"],
		maxAge,
		verbose: true,
	});
}
