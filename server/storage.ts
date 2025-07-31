/** @format */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
	users,
	audioTracks,
	type User,
	type InsertUser,
	type AudioTrack,
	type InsertAudioTrack,
	type UpdateAudioTrack,
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Validates DATABASE_URL format to prevent connection string injection attacks
 * Ensures the URL follows expected PostgreSQL connection string format
 */
function validateDatabaseUrl(url: string): void {
	// Enhanced PostgreSQL connection string format validation
	// Format: postgres://user:password@host:port/database
	// Also supports postgresql:// scheme and additional query parameters
	//
	// Enhanced to support more valid characters:
	// - User/Database: a-z, A-Z, 0-9, _, ., ~, - (RFC 3986 unreserved + common DB chars)
	// - Host: a-z, A-Z, 0-9, ., _, - (standard hostname + IP address characters)
	// - Password: Excludes only @ and whitespace to prevent parsing issues
	const postgresUrlRegex =
		/^postgres(ql)?:\/\/[a-zA-Z0-9._~-]+:[^@\s]+@[a-zA-Z0-9._-]+:\d+\/[a-zA-Z0-9._~-]+(\?.*)?$/;

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
		/\bunion\s+select\b/i, // Union-based injection
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

// Ensure DATABASE_URL is defined and valid
if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL environment variable is not defined");
}

validateDatabaseUrl(process.env.DATABASE_URL);

const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
	getUser(id: number): Promise<User | undefined>;
	getUserByUsername(username: string): Promise<User | undefined>;
	createUser(user: InsertUser): Promise<User>;
	getAudioTrack(id: number): Promise<AudioTrack | undefined>;
	createAudioTrack(track: InsertAudioTrack): Promise<AudioTrack>;
	updateAudioTrack(
		id: number,
		update: UpdateAudioTrack
	): Promise<AudioTrack | undefined>;
	getAudioTracksByUserId(userId: number): Promise<AudioTrack[]>;
	deleteAudioTrack(id: number): Promise<void>;
	deleteAllUserTracks(userId: number): Promise<void>;
}

export class PostgresStorage implements IStorage {
	async getUser(id: number): Promise<User | undefined> {
		const result = await db.select().from(users).where(eq(users.id, id));
		return result[0];
	}

	async getUserByUsername(username: string): Promise<User | undefined> {
		const result = await db
			.select()
			.from(users)
			.where(eq(users.username, username));
		return result[0];
	}

	async createUser(insertUser: InsertUser): Promise<User> {
		const result = await db.insert(users).values(insertUser).returning();
		return result[0];
	}

	async getAudioTrack(id: number): Promise<AudioTrack | undefined> {
		const result = await db
			.select()
			.from(audioTracks)
			.where(eq(audioTracks.id, id));
		return result[0];
	}

	async createAudioTrack(
		insertAudioTrack: InsertAudioTrack
	): Promise<AudioTrack> {
		const result = await db
			.insert(audioTracks)
			.values(insertAudioTrack)
			.returning();
		return result[0];
	}

	async updateAudioTrack(
		id: number,
		updateAudioTrack: UpdateAudioTrack
	): Promise<AudioTrack | undefined> {
		const result = await db
			.update(audioTracks)
			.set(updateAudioTrack)
			.where(eq(audioTracks.id, id))
			.returning();
		return result[0];
	}

	async getAudioTracksByUserId(userId: number): Promise<AudioTrack[]> {
		return await db
			.select()
			.from(audioTracks)
			.where(eq(audioTracks.userId, userId))
			.orderBy(desc(audioTracks.id));
	}

	async deleteAudioTrack(id: number): Promise<void> {
		await db.delete(audioTracks).where(eq(audioTracks.id, id));
	}

	async deleteAllUserTracks(userId: number): Promise<void> {
		await db.delete(audioTracks).where(eq(audioTracks.userId, userId));
	}
}

export const storage = new PostgresStorage();
