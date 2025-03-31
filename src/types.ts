/**
 * Type definitions for the Omi API
 */

export interface Memory {
	id: string;
	content: string;
	created_at: string;
	tags: string[];
}

export interface Env {
	API_KEY: string;
	APP_ID: string;
}

export interface Geolocation {
	latitude: number;
	longitude: number;
}

export interface TranscriptSegment {
	text: string;
	start_time: number;
	end_time: number;
}

export interface StructuredConversation {
	title: string;
	overview: string;
}

export interface Conversation {
	id: string;
	created_at: string;
	started_at: string;
	finished_at: string;
	text: string;
	structured: StructuredConversation;
	transcript_segments: TranscriptSegment[];
	geolocation: Geolocation;
}

export interface ConversationsResponse {
	conversations: Conversation[];
}

export interface MemoriesResponse {
	memories: Memory[];
}

export interface CreateMemoryOptionsBase {
	user_id: string; // Now required (removed default USER_ID)
	text_source?: 'email' | 'social_post' | 'other';
	text_source_spec?: string;
}

export interface CreateMemoryWithText extends CreateMemoryOptionsBase {
	text: string;
	memories?: never; // Ensure memories is not provided when text is
}

export interface CreateMemoryWithMemories extends CreateMemoryOptionsBase {
	text?: never; // Ensure text is not provided when memories is
	memories: Array<{ content: string; tags?: string[] }>;
}

export type CreateMemoryOptions = CreateMemoryWithText | CreateMemoryWithMemories;
