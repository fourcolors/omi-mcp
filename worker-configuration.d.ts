interface Memory {
	id: string;
	content: string;
	created_at: string;
	tags: string[];
}

interface MemoriesResponse {
	memories: Memory[];
}

interface Env {
	API_KEY: string;
	APP_ID: string;
	SHARED_SECRET: string;
}

interface Geolocation {
	latitude: number;
	longitude: number;
}

interface TranscriptSegment {
	text: string;
	start_time: number;
	end_time: number;
}

interface StructuredConversation {
	title: string;
	overview: string;
}

interface Conversation {
	id: string;
	created_at: string;
	started_at: string;
	finished_at: string;
	text: string;
	structured: StructuredConversation;
	transcript_segments: TranscriptSegment[];
	geolocation: Geolocation;
}

interface ConversationsResponse {
	conversations: Conversation[];
}
