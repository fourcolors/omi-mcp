import { WorkerEntrypoint } from 'cloudflare:workers';
import { ProxyToSelf } from 'workers-mcp';

// Define environment variables interface
interface Env {
	API_KEY: string;
	APP_ID: string;
	SHARED_SECRET: string;
}

const USER_ID = 'PIVswRdbkOQimAqwxKTO0oH5EFO2';

export interface Memory {
	id: string;
	content: string;
	created_at: string;
	tags: string[];
}

export default class OmiWorker extends WorkerEntrypoint<Env> {
	/**
	 * Retrieve conversations from Omi for a specific user, with optional filters for pagination and filtering.
	 * @param {string} [user_id=USER_ID] - The user ID to fetch conversations for (defaults to predefined USER_ID).
	 * @param {number} [limit=100] - Maximum number of conversations to return (optional, max: 1000, default: 100).
	 * @param {number} [offset=0] - Number of conversations to skip for pagination (optional, default: 0).
	 * @param {boolean} [include_discarded=false] - Whether to include discarded conversations (optional, default: false).
	 * @param {string} [statuses] - Comma-separated list of statuses to filter conversations by (optional).
	 * @return {Promise<string>} A JSON string containing the array of conversations. Conversations are detailed objects.
	 *  Example Conversation structure (from documentation):
	 * {
	 *   "conversations": [
	 *     {
	 *       "id": "conversation_id_1",
	 *       "created_at": "2024-03-15T12:00:00Z",
	 *       "started_at": "2024-03-15T12:00:00Z",
	 *       "finished_at": "2024-03-15T12:05:00Z",
	 *       "text": "Full conversation text content...",
	 *       "structured": {
	 *         "title": "Conversation Title",
	 *         "overview": "Brief overview of the conversation"
	 *       },
	 *       "transcript_segments": [
	 *         {
	 *           "text": "Segment text...",
	 *           "start_time": 0,
	 *           "end_time": 10
	 *         }
	 *       ],
	 *       "geolocation": {
	 *         "latitude": 37.7749,
	 *         "longitude": -122.4194
	 *       }
	 *     }
	 *   ]
	 * }
	 */
	async read_omi_conversations(
		user_id: string = USER_ID,
		limit?: number,
		offset?: number,
		include_discarded?: boolean,
		statuses?: string
	): Promise<string> {
		try {
			const apiKey = this.env.API_KEY;
			const appId = this.env.APP_ID;

			console.log(`Using appId: ${appId}`);
			console.log(`User ID: ${user_id}`);

			if (!apiKey || !appId) {
				throw new Error('API_KEY or APP_ID not found in environment variables');
			}

			// Construct URL with query parameters
			const url = new URL(`https://api.omi.me/v2/integrations/${appId}/conversations`);
			const params = new URLSearchParams();
			params.append('uid', user_id);

			if (typeof limit === 'number') {
				params.append('limit', String(limit));
			}
			if (typeof offset === 'number') {
				params.append('offset', String(offset));
			}
			if (typeof include_discarded === 'boolean') {
				params.append('include_discarded', String(include_discarded));
			}
			if (typeof statuses === 'string' && statuses.length > 0) {
				params.append('statuses', statuses);
			}

			url.search = params.toString();

			const fetchUrl = url.toString();
			console.log(`Fetching from URL: ${fetchUrl}`);

			const response = await fetch(fetchUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			console.log(`Response status: ${response.status}`);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText} - ${errorText}`);
			}

			const data = (await response.json()) as ConversationsResponse;
			console.log('Data:', data);

			const conversations = data.conversations || [];
			console.log('Conversations:', conversations);

			return JSON.stringify({ conversations });
		} catch (error) {
			console.error('Error fetching conversations:', error);
			throw new Error(`Failed to read conversations: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Retrieve memories from Omi for a specific user.
	 * @param {string} [user_id=USER_ID] - The user ID to fetch memories for (defaults to predefined USER_ID).
	 * @param {number} [limit=100] - Maximum number of memories to return (optional, max: 1000, default: 100).
	 * @param {number} [offset=0] - Number of memories to skip for pagination (optional, default: 0).
	 * @return {Promise<string>} a JSON response containing the array of memories. Memories look like this:
	 * {
	 *   "id": "string",
	 *   "content": "string",
	 *   "created_at": "string",
	 *   "tags": ["string"]
	 * }
	 */
	async read_omi_memories(user_id: string = USER_ID, limit?: number, offset?: number) {
		try {
			// Access environment variables for authentication
			const apiKey = this.env.API_KEY;
			const appId = this.env.APP_ID;

			console.log(`Using appId: ${appId}`);
			console.log(`User ID: ${user_id}`);

			if (!apiKey || !appId) {
				throw new Error('API_KEY or APP_ID not found in environment variables');
			}

			// Construct URL with query parameters
			const url = new URL(`https://api.omi.me/v2/integrations/${appId}/memories`);
			const params = new URLSearchParams();
			params.append('uid', user_id);

			if (typeof limit === 'number') {
				params.append('limit', String(limit));
			}
			if (typeof offset === 'number') {
				params.append('offset', String(offset));
			}

			url.search = params.toString();

			const fetchUrl = url.toString();
			console.log(`Fetching from URL: ${fetchUrl}`);

			// Make authenticated request to Omi API
			const response = await fetch(fetchUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			console.log(`Response status: ${response.status}`);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch memories: ${response.status} ${response.statusText} - ${errorText}`);
			}

			const data = (await response.json()) as MemoriesResponse;
			console.log('Data:', data);
			const memories = data.memories || [];
			console.log('Memories:', memories);

			return JSON.stringify({ memories });
		} catch (error) {
			console.error('Error fetching memories:', error);
			throw new Error(`Failed to read memories: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Create a new conversation in Omi for a specific user.
	 * @param {string} text - The full text content of the conversation
	 * @param {string} [user_id=USER_ID] - The user ID to create the conversation for (defaults to predefined USER_ID)
	 * @param {string} [started_at] - When the conversation started (ISO 8601) - defaults to current time
	 * @param {string} [finished_at] - When the conversation ended (ISO 8601) - defaults to started_at + 5min
	 * @param {string} [language="en"] - Language code (e.g., "en" for English)
	 * @param {Object} [geolocation] - Location data {latitude: number, longitude: number}
	 * @param {string} [text_source="audio_transcript"] - Source of text content
	 * @param {string} [text_source_spec] - Additional source specification
	 * @return {Promise<string>} Empty JSON object on success (e.g., "{}" will be returned when conversation is created successfully)
	 */
	async create_omi_conversation(
		text: string,
		user_id: string = USER_ID,
		started_at?: string,
		finished_at?: string,
		language: string = 'en',
		geolocation?: { latitude: number; longitude: number },
		text_source: string = 'audio_transcript',
		text_source_spec?: string
	): Promise<string> {
		try {
			const apiKey = this.env.API_KEY;
			const appId = this.env.APP_ID;

			if (!apiKey || !appId) {
				throw new Error('API_KEY or APP_ID not found in environment variables');
			}

			const url = `https://api.omi.me/v2/integrations/${appId}/user/conversations?uid=${user_id}`;

			const body = {
				text,
				started_at,
				finished_at,
				language,
				geolocation,
				text_source,
				text_source_spec,
			};

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to create conversation: ${response.status} ${response.statusText} - ${errorText}`);
			}

			return '{}';
		} catch (error) {
			console.error('Error creating conversation:', error);
			throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Create new memories in Omi for a specific user. This can be done by either providing text content
	 * from which memories will be extracted, or by directly specifying memory objects.
	 * @param {string} [user_id=USER_ID] - The user ID to create memories for (defaults to predefined USER_ID)
	 * @param {string} [text] - The text content from which memories will be extracted
	 * @param {Array<{content: string, tags?: string[]}>} [memories] - Array of explicit memory objects to create
	 * @param {string} [text_source="other"] - Source of text content ("email", "social_post", "other")
	 * @param {string} [text_source_spec] - Additional source specification
	 * @return {Promise<string>} Empty JSON object on success (e.g., "{}" will be returned when memories are created successfully)
	 */
	async create_omi_memory(
		user_id: string = USER_ID,
		text?: string,
		memories?: Array<{ content: string; tags?: string[] }>,
		text_source: string = 'other',
		text_source_spec?: string
	): Promise<string> {
		try {
			const apiKey = this.env.API_KEY;
			const appId = this.env.APP_ID;

			if (!apiKey || !appId) {
				throw new Error('API_KEY or APP_ID not found in environment variables');
			}

			if (!text && !memories) {
				throw new Error('Either text or memories must be provided');
			}

			const url = `https://api.omi.me/v2/integrations/${appId}/user/memories?uid=${user_id}`;

			const body = {
				text,
				memories,
				text_source,
				text_source_spec,
			};

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to create memory: ${response.status} ${response.statusText} - ${errorText}`);
			}

			return '{}';
		} catch (error) {
			console.error('Error creating memory:', error);
			throw new Error(`Failed to create memory: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * @ignore
	 **/
	async fetch(request: Request): Promise<Response> {
		return new ProxyToSelf(this).fetch(request);
	}
}
