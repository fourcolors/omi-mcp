import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { z } from 'zod';
import { ConversationsResponse, MemoriesResponse } from './types';

// Declare logStream at module level
let logStream: fs.WriteStream | undefined;

// Set up logging with safer path in home directory
const homedir = os.homedir();
const logDir = path.join(homedir, '.omi-mcp-logs');
try {
	if (!fs.existsSync(logDir)) {
		fs.mkdirSync(logDir, { recursive: true });
	}

	const logFile = path.join(logDir, 'mcp-server.log');
	logStream = fs.createWriteStream(logFile, { flags: 'a' });
} catch (error) {
	// Fallback to console logging if file logging fails
	console.error(`Error setting up log file: ${error}`);
}

// Define log function
function log(message: string) {
	const timestamp = new Date().toISOString();
	// Log to stderr instead of stdout to avoid interfering with MCP JSON messages
	console.error(`[${timestamp}] ${message}`);

	// Try to log to file if stream exists
	try {
		if (logStream && typeof logStream.write === 'function') {
			const logMessage = `[${timestamp}] ${message}\n`;
			logStream.write(logMessage);
		}
	} catch (error) {
		console.error(`Failed to write to log file: ${error}`);
	}
}

// Load environment variables from .env file
dotenv.config();

// Get API credentials from environment variables
const API_KEY = process.env.API_KEY || '';
const APP_ID = process.env.APP_ID || '';

if (!API_KEY || !APP_ID) {
	log('API_KEY or APP_ID not found in environment variables');
	process.exit(1);
}

// Create an MCP server
const server = new McpServer({
	name: 'Omi-MCP',
	version: '1.0.0',
});

/**
 * Retrieve conversations from Omi for a specific user, with optional filters for pagination and filtering.
 *
 * @param {Object} params - The parameters for the conversation request
 * @param {string} params.user_id - The user ID to fetch conversations for
 * @param {number} [params.limit] - Maximum number of conversations to return (max: 1000, default: 100)
 * @param {number} [params.offset] - Number of conversations to skip for pagination (default: 0)
 * @param {boolean} [params.include_discarded] - Whether to include discarded conversations (default: false)
 * @param {string} [params.statuses] - Comma-separated list of statuses to filter conversations by
 * @returns {Promise<Object>} A response containing the array of conversations in JSON format
 */
server.tool(
	'read_omi_conversations',
	'Retrieves user conversations from Omi with pagination and filtering options',
	{
		user_id: z.string().describe('The user ID to fetch conversations for'),
		limit: z.number().optional().describe('Maximum number of conversations to return (max: 1000, default: 100)'),
		offset: z.number().optional().describe('Number of conversations to skip for pagination (default: 0)'),
		include_discarded: z.boolean().optional().describe('Whether to include discarded conversations (default: false)'),
		statuses: z.string().optional().describe('Comma-separated list of statuses to filter conversations by'),
	},
	async ({ user_id, limit, offset, include_discarded, statuses }) => {
		try {
			log(`Using appId: ${APP_ID}`);
			log(`User ID: ${user_id}`);

			// Construct URL with query parameters
			const url = new URL(`https://api.omi.me/v2/integrations/${APP_ID}/conversations`);
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
			log(`Fetching from URL: ${fetchUrl}`);

			const response = await fetch(fetchUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
			});

			log(`Response status: ${response.status}`);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText} - ${errorText}`);
			}

			const data = (await response.json()) as ConversationsResponse;
			log('Data received');

			const conversations = data.conversations || [];

			return {
				content: [{ type: 'text', text: JSON.stringify({ conversations }) }],
			};
		} catch (error) {
			log(`Error fetching conversations: ${error}`);
			throw new Error(`Failed to read conversations: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
);

/**
 * Retrieve memories from Omi for a specific user, with optional pagination.
 *
 * @param {Object} params - The parameters for the memories request
 * @param {string} params.user_id - The user ID to fetch memories for
 * @param {number} [params.limit] - Maximum number of memories to return (max: 1000, default: 100)
 * @param {number} [params.offset] - Number of memories to skip for pagination (default: 0)
 * @returns {Promise<Object>} A response containing the array of memories in JSON format
 */
server.tool(
	'read_omi_memories',
	'Retrieves user memories from Omi with pagination options',
	{
		user_id: z.string().describe('The user ID to fetch memories for'),
		limit: z.number().optional().describe('Maximum number of memories to return (max: 1000, default: 100)'),
		offset: z.number().optional().describe('Number of memories to skip for pagination (default: 0)'),
	},
	async ({ user_id, limit, offset }) => {
		try {
			log(`Using appId: ${APP_ID}`);
			log(`User ID: ${user_id}`);

			// Construct URL with query parameters
			const url = new URL(`https://api.omi.me/v2/integrations/${APP_ID}/memories`);
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
			log(`Fetching from URL: ${fetchUrl}`);

			const response = await fetch(fetchUrl, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
			});

			log(`Response status: ${response.status}`);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to fetch memories: ${response.status} ${response.statusText} - ${errorText}`);
			}

			const data = (await response.json()) as MemoriesResponse;
			log('Data received');

			const memories = data.memories || [];

			return {
				content: [{ type: 'text', text: JSON.stringify({ memories }) }],
			};
		} catch (error) {
			log(`Error fetching memories: ${error}`);
			throw new Error(`Failed to read memories: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
);

/**
 * Create a new conversation in Omi for a specific user.
 *
 * @param {Object} params - The parameters for creating a conversation
 * @param {string} params.text - The full text content of the conversation
 * @param {string} params.user_id - The user ID to create the conversation for
 * @param {string} params.text_source - Required source of the text content (options: "audio_transcript", "message", "other_text")
 * @param {string} [params.started_at] - When the conversation/event started (ISO 8601 format)
 * @param {string} [params.finished_at] - When the conversation/event ended (ISO 8601 format)
 * @param {string} [params.language="en"] - Language code (e.g., "en" for English) - defaults to "en"
 * @param {Object} [params.geolocation] - Location data for the conversation
 * @param {number} params.geolocation.latitude - Latitude coordinate
 * @param {number} params.geolocation.longitude - Longitude coordinate
 * @param {string} [params.text_source_spec] - Additional specification about the source
 * @returns {Promise<Object>} Empty response on success
 */
server.tool(
	'create_omi_conversation',
	'Creates a new Omi conversation with text content and metadata',
	{
		text: z.string().describe('The full text content of the conversation'),
		user_id: z.string().describe('The user ID to create the conversation for'),
		text_source: z
			.enum(['audio_transcript', 'message', 'other_text'])
			.describe('Source of the text content. Required. Options: "audio_transcript", "message", "other_text".'),
		started_at: z.string().optional().describe('When the conversation/event started in ISO 8601 format. Optional.'),
		finished_at: z.string().optional().describe('When the conversation/event ended in ISO 8601 format. Optional.'),
		language: z.string().default('en').describe('Language code (e.g., "en" for English). Optional, defaults to "en".'),
		geolocation: z
			.object({
				latitude: z.number().describe('Latitude coordinate. Required when geolocation is provided.'),
				longitude: z.number().describe('Longitude coordinate. Required when geolocation is provided.'),
			})
			.optional()
			.describe('Location data for the conversation. Optional object containing latitude and longitude.'),
		text_source_spec: z.string().optional().describe('Additional specification about the source. Optional.'),
	},
	async ({ text, user_id, text_source, started_at, finished_at, language, geolocation, text_source_spec }) => {
		try {
			const url = `https://api.omi.me/v2/integrations/${APP_ID}/user/conversations?uid=${user_id}`;

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

			log(`Creating conversation with URL: ${url}`);
			log(`Request body: ${JSON.stringify(body)}`);

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			log(`Response status: ${response.status}`);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to create conversation: ${response.status} ${response.statusText} - ${errorText}`);
			}

			return {
				content: [{ type: 'text', text: '{}' }],
			};
		} catch (error) {
			log(`Error creating conversation: ${error}`);
			throw new Error(`Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
);

/**
 * Create new memories in Omi for a specific user. Requires either 'text' (for extraction) or 'memories' (for direct creation).
 *
 * @param {Object} params - The parameters for creating memories
 * @param {string} params.user_id - The user ID to create memories for
 * @param {string} [params.text] - The text content from which memories will be extracted
 * @param {Array<Object>} [params.memories] - An array of explicit memory objects to be created directly
 * @param {string} params.memories[].content - The content of the memory
 * @param {Array<string>} [params.memories[].tags] - Optional tags for the memory
 * @param {string} [params.text_source] - Source of the text content (options: "email", "social_post", "other")
 * @param {string} [params.text_source_spec] - Additional specification about the source
 * @returns {Promise<Object>} Empty response on success
 */
server.tool(
	'create_omi_memories',
	'Creates Omi memories by extracting from text or using explicit memory objects',
	{
		user_id: z.string().describe('The user ID to create memories for'),
		text: z.string().optional().describe('The text content from which memories will be extracted. Either this or memories must be provided.'),
		memories: z
			.array(
				z.object({
					content: z.string().describe('The content of the memory. Required.'),
					tags: z.array(z.string().describe('A tag for the memory.')).optional().describe('Optional tags for the memory.'),
				})
			)
			.optional()
			.describe('An array of explicit memory objects to be created directly. Either this or text must be provided.'),
		text_source: z.enum(['email', 'social_post', 'other']).optional().describe('Source of the text content. Optional. Options: "email", "social_post", "other".'),
		text_source_spec: z.string().optional().describe('Additional specification about the source. Optional.'),
	},
	async ({ user_id, text, memories, text_source, text_source_spec }) => {
		try {
			// Runtime check
			if (!text && !memories) {
				throw new Error('Either text or memories must be provided');
			}

			const url = `https://api.omi.me/v2/integrations/${APP_ID}/user/memories?uid=${user_id}`;

			// Construct the body, including only defined fields
			const body: Record<string, any> = {};
			if (text) body.text = text;
			if (memories) body.memories = memories;
			if (text_source) body.text_source = text_source;
			if (text_source_spec) body.text_source_spec = text_source_spec;

			log(`Creating memories with URL: ${url}`);
			log(`Request body: ${JSON.stringify(body)}`);

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			log(`Response status: ${response.status}`);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Failed to create memory: ${response.status} ${response.statusText} - ${errorText}`);
			}

			return {
				content: [{ type: 'text', text: '{}' }],
			};
		} catch (error) {
			log(`Error creating memory: ${error}`);
			throw new Error(`Failed to create memory: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
);

// Main function to start the server
async function main() {
	try {
		// Log startup message to stderr before establishing transport
		console.error(`[${new Date().toISOString()}] Starting MCP server...`);

		// Start receiving messages on stdin and sending messages on stdout
		const transport = new StdioServerTransport();
		await server.connect(transport);

		// Log success message to stderr and file
		log('MCP server started successfully');
	} catch (error) {
		log(`Error starting MCP server: ${error}`);
		process.exit(1);
	}
}

// Run the main function
main();

// Handle cleanup on exit
process.on('exit', () => {
	if (logStream) {
		try {
			logStream.end();
			console.error('Log stream closed successfully');
		} catch (err) {
			console.error(`Error closing log stream: ${err}`);
		}
	}
});

// Handle other termination signals
process.on('SIGINT', () => {
	console.error('Received SIGINT signal, shutting down...');
	process.exit(0);
});

process.on('SIGTERM', () => {
	console.error('Received SIGTERM signal, shutting down...');
	process.exit(0);
});
