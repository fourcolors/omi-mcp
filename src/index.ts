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

export interface MemoriesResponse {
	memories: Memory[];
}

export default class OmiWorker extends WorkerEntrypoint<Env> {
	/**
	 * Retrieve memories from Omi for a specific user.
	 * @param user_id {string} The user ID to fetch memories for (defaults to predefined USER_ID).
	 * @return {Promise<string>} a JSON response containing the array of memories. Memories look like this:
	 * {
	 *   "id": "string",
	 *   "content": "string",
	 *   "created_at": "string",
	 *   "tags": ["string"]
	 * }
	 */
	async read_omi_memories(user_id: string = USER_ID) {
		try {
			// Access environment variables for authentication
			const apiKey = this.env.API_KEY;
			const appId = this.env.APP_ID;

			console.log(`Using appId: ${appId}`); // Add logging for debugging
			console.log(`User ID: ${user_id}`); // Add logging for debugging

			if (!apiKey || !appId) {
				throw new Error('API_KEY or APP_ID not found in environment variables');
			}

			const url = `https://api.omi.me/v2/integrations/${appId}/memories?uid=${user_id}`;
			console.log(`Fetching from URL: ${url}`); // Add logging for debugging

			// Make authenticated request to Omi API
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${apiKey}`,
					'Content-Type': 'application/json',
				},
			});

			console.log(`Response status: ${response.status}`); // Add logging for debugging

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
	 * @ignore
	 **/
	async fetch(request: Request): Promise<Response> {
		return new ProxyToSelf(this).fetch(request);
	}
}
