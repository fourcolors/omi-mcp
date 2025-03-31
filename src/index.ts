import { WorkerEntrypoint } from 'cloudflare:workers';
import { ProxyToSelf } from 'workers-mcp';

const USER_ID = 'PIVswRdbkOQimAqwxKTO0oH5EFO2';

export default class OmiWorker extends WorkerEntrypoint<Env> {
	/**
	 * Retrieve conversations from Omi for a specific user, with optional filters for pagination and filtering.
	 * @param {string} [user_id=USER_ID] - The user ID to fetch conversations for (defaults to predefined USER_ID).
	 * @param {number} [limit=100] - Maximum number of conversations to return (optional, max: 1000, default: 100).
	 * @param {number} [offset=0] - Number of conversations to skip for pagination (optional, default: 0).
	 * @param {boolean} [include_discarded=false] - Whether to include discarded conversations (optional, default: false).
	 * @param {string} [statuses] - Comma-separated list of statuses to filter conversations by (optional).
	 * @return {Promise<string>} A JSON string containing the array of conversations.
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

			// Assuming the response structure matches ConversationsResponse
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
	 * @return {Promise<string>} a JSON response containing the array of memories.
	 */
	async read_omi_memories(user_id: string = USER_ID, limit?: number, offset?: number): Promise<string> {
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

			// Assuming the response structure matches MemoriesResponse
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
	 * @param {string} text - The full text content of the conversation.
	 * @param {string} [user_id=USER_ID] - The user ID to create the conversation for (defaults to predefined USER_ID).
	 * @param {string} text_source - Required source of the text content (options: "audio_transcript", "message", "other_text").
	 * @param {string} [started_at] - When the conversation/event started (ISO 8601 format) - defaults to current time if not provided.
	 * @param {string} [finished_at] - When the conversation/event ended (ISO 8601 format) - defaults to started_at + 5 minutes if not provided.
	 * @param {string} [language="en"] - Language code (e.g., "en" for English) - defaults to "en" if not provided.
	 * @param {object} [geolocation] - Location data for the conversation.
	 * @param {number} [geolocation.latitude] - Latitude coordinate.
	 * @param {number} [geolocation.longitude] - Longitude coordinate.
	 * @param {string} [text_source_spec] - Additional specification about the source (optional).
	 * @return {Promise<string>} Empty JSON object on success (e.g., "{}" will be returned when conversation is created successfully).
	 */
	async create_omi_conversation(
		text: string,
		user_id: string = USER_ID,
		text_source: 'audio_transcript' | 'message' | 'other_text',
		started_at?: string,
		finished_at?: string,
		language: string = 'en',
		geolocation?: { latitude: number; longitude: number },
		text_source_spec?: string
	): Promise<string> {
		try {
			const apiKey = this.env.API_KEY;
			const appId = this.env.APP_ID;

			if (!apiKey || !appId) {
				throw new Error('API_KEY or APP_ID not found in environment variables');
			}

			// Validate required parameters
			if (!text) {
				throw new Error('text is required');
			}
			if (!text_source) {
				throw new Error('text_source is required');
			}

			const url = `https://api.omi.me/v2/integrations/${appId}/user/conversations?uid=${user_id}`;

			// Construct the body with required parameters
			const body: Record<string, any> = {
				text,
				text_source,
				language,
			};

			// Add optional parameters only if they are defined
			if (started_at) body.started_at = started_at;
			if (finished_at) body.finished_at = finished_at;
			if (geolocation) body.geolocation = geolocation;
			if (text_source_spec) body.text_source_spec = text_source_spec;

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

			// Omi API might return an empty body or a specific success object.
			// Returning an empty JSON string as per the original doc comment.
			return '{}';
		} catch (error) {
			console.error('Error creating conversation:', error);
			throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Create new memories in Omi for a specific user. Requires either 'text' (for extraction) or 'memories' (for direct creation).
	 * @param {string} [user_id=USER_ID] - The user ID to create memories for (defaults to predefined USER_ID).
	 * @param {string} [text] - The text content from which memories will be extracted. Provide this AND optional 'memories' array.
	 * @param {Array<Object>} [memories] - An array of explicit memory objects to be created directly. Provide this OR 'text'.
	 * @param {string} [text_source="other"] - Source of the text content (options: "email", "social_post", "other") - defaults to "other".
	 * @param {string} [text_source_spec] - Additional specification about the source (optional).
	 * @return {Promise<string>} Empty JSON object on success (e.g., "{}" will be returned when memories are created successfully).
	 */
	async create_omi_memories(
		user_id: string = USER_ID,
		text?: string,
		memories?: Array<{ content: string; tags?: string[] }>,
		text_source?: string,
		text_source_spec?: string
	): Promise<string> {
		try {
			const apiKey = this.env.API_KEY;
			const appId = this.env.APP_ID;

			if (!apiKey || !appId) {
				throw new Error('API_KEY or APP_ID not found in environment variables');
			}

			// Runtime check (optional but good practice, TypeScript handles compile-time)
			if (!text && !memories) {
				// This case should be prevented by the TypeScript types, but belt-and-suspenders.
				throw new Error('Either text or memories must be provided');
			}
			if (text && memories) {
				// This case *is* prevented by the `never` type in the union.
				// If somehow it gets here, it indicates a TS config issue or `any` usage elsewhere.
				console.warn('Both text and memories were provided to create_omi_memory. Prefer providing only one.');
				// Decide how to handle this - perhaps prioritize 'memories' or throw an error.
				// For now, we'll let the API decide or potentially fail if it doesn't support both.
			}

			const url = `https://api.omi.me/v2/integrations/${appId}/user/memories?uid=${user_id}`;

			// Construct the body, including only defined fields
			const body: Record<string, any> = { text_source }; // text_source defaults to 'other' if not in options
			if (text) body.text = text;
			if (memories) body.memories = memories;
			if (text_source_spec) body.text_source_spec = text_source_spec;

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

			// Returning an empty JSON string as per the original doc comment.
			return '{}';
		} catch (error) {
			console.error('Error creating memory:', error);
			throw new Error(`Failed to create memory: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	/**
	 * Handles incoming HTTP requests to the Cloudflare Worker.
	 * This basic implementation uses `ProxyToSelf` to automatically route requests
	 * to the corresponding public methods of this class based on the request path/method.
	 * For more complex routing or middleware, this method would need customization.
	 * @param {Request} request - The incoming HTTP request object.
	 * @return {Promise<Response>} A Promise resolving to the HTTP Response object to send back.
	 **/
	async fetch(request: Request): Promise<Response> {
		// ProxyToSelf automatically maps request paths/methods to class methods.
		// Example: A POST request to `/create_omi_conversation` would call `this.create_omi_conversation(...)`.
		// It likely extracts parameters from the request body or query string based on method signatures.
		// Refer to `workers-mcp` documentation for exact behavior.
		console.log(`Incoming request: ${request.method} ${request.url}`);
		try {
			const response = await new ProxyToSelf(this).fetch(request);
			console.log(`Outgoing response status: ${response.status}`);
			return response;
		} catch (error) {
			console.error('Error during request handling in fetch:', error);
			// Provide a generic error response for unhandled exceptions during routing/proxying
			return new Response(JSON.stringify({ error: 'Internal worker error during request processing.' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}
}
