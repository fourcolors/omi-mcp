# Omi MCP Server

This project provides a Model Context Protocol (MCP) server for interacting with the Omi API. The server provides tools for reading conversations and memories, as well as creating new conversations and memories.

## Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the following variables:
   ```
   API_KEY=your_api_key
   APP_ID=your_app_id
   SHARED_SECRET=your_shared_secret
   ```

## Usage

### Building the Server

```bash
npm run build
```

### Running the Server

```bash
npm run start
```

### Development Mode

For development with hot-reloading:

```bash
npm run dev
```

### Testing the Server

A simple test client is included to interact with the MCP server. After building the project, run:

```bash
npm run test
```

Or directly:

```bash
./test-mcp-client.js
```

This will start the MCP server and provide an interactive menu to test the available tools.

### Clean and Rebuild

To clean the build directory and rebuild from scratch:

```bash
npm run rebuild
```

## Configuration with Claude and Cursor

### Claude Configuration

To use this MCP server with Claude via Anthropic Console or API:

1. Start the MCP server locally:

   ```bash
   npm run start
   ```

2. When setting up your Claude conversation, configure the MCP connection:

   ```json
   {
   	"mcp_config": {
   		"transports": [
   			{
   				"type": "stdio",
   				"executable": {
   					"path": "/path/to/your/omi-mcp-local/dist/mcp-server.js",
   					"args": []
   				}
   			}
   		]
   	}
   }
   ```

3. Example prompt to Claude:

   ```
   Please fetch the latest 5 conversations for user "user123" using the Omi API.
   ```

4. Claude will use the MCP to execute the `read_omi_conversations` tool:
   ```json
   {
   	"id": "req-1",
   	"type": "request",
   	"method": "tools.read_omi_conversations",
   	"params": {
   		"user_id": "user123",
   		"limit": 5
   	}
   }
   ```

### Cursor Configuration

To use this MCP server with Cursor:

1. Start the MCP server in a terminal:

   ```bash
   npm run start
   ```

2. In Cursor, go to Settings > Extensions > MCP Servers

3. Add a new MCP server with these settings:

   - Name: Omi API
   - URL: stdio:/path/to/your/omi-mcp-local/dist/mcp-server.js
   - Enable the server

4. Now you can use the Omi tools directly within Cursor. For example:

   ```
   @Omi API Please fetch memories for user "user123" and summarize them.
   ```

5. Cursor will communicate with your MCP server to execute the necessary API calls.

## Available Tools

The MCP server provides the following tools:

### read_omi_conversations

Retrieves conversations from Omi for a specific user, with optional filters.

Parameters:

- `user_id` (string): The user ID to fetch conversations for
- `limit` (number, optional): Maximum number of conversations to return
- `offset` (number, optional): Number of conversations to skip for pagination
- `include_discarded` (boolean, optional): Whether to include discarded conversations
- `statuses` (string, optional): Comma-separated list of statuses to filter conversations by

### read_omi_memories

Retrieves memories from Omi for a specific user.

Parameters:

- `user_id` (string): The user ID to fetch memories for
- `limit` (number, optional): Maximum number of memories to return
- `offset` (number, optional): Number of memories to skip for pagination

### create_omi_conversation

Creates a new conversation in Omi for a specific user.

Parameters:

- `text` (string): The full text content of the conversation
- `user_id` (string): The user ID to create the conversation for
- `text_source` (string): Source of the text content (options: "audio_transcript", "message", "other_text")
- `started_at` (string, optional): When the conversation/event started (ISO 8601 format)
- `finished_at` (string, optional): When the conversation/event ended (ISO 8601 format)
- `language` (string, optional): Language code (default: "en")
- `geolocation` (object, optional): Location data for the conversation
  - `latitude` (number): Latitude coordinate
  - `longitude` (number): Longitude coordinate
- `text_source_spec` (string, optional): Additional specification about the source

### create_omi_memories

Creates new memories in Omi for a specific user.

Parameters:

- `user_id` (string): The user ID to create memories for
- `text` (string, optional): The text content from which memories will be extracted
- `memories` (array, optional): An array of explicit memory objects to be created directly
  - `content` (string): The content of the memory
  - `tags` (array of strings, optional): Tags for the memory
- `text_source` (string, optional): Source of the text content
- `text_source_spec` (string, optional): Additional specification about the source

## Migration from Cloudflare Worker

This project was converted from a Cloudflare Worker to a local MCP server using stdio communication. The conversion process involved:

1. Setting up environment variables in a `.env` file instead of using Wrangler's `.dev.vars`
2. Converting each Cloudflare Worker method to an MCP tool
3. Implementing the StdioServerTransport to handle communication via stdin/stdout
4. Updating the build configuration to emit JavaScript files
