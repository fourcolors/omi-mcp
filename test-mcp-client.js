#!/usr/bin/env node

/**
 * Simple test script to interact with the Omi MCP server
 *
 * Usage:
 *   node test-mcp-client.js
 */
const { spawn } = require('child_process');
const readline = require('readline');

// Default test user ID
const TEST_USER_ID = 'test-user-123';

// Start the MCP server process
const mcpServer = spawn('node', ['./dist/mcp-server.js'], {
	stdio: ['pipe', 'pipe', process.stderr],
});

// Set up readline interface for user input
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

// Handle server output
mcpServer.stdout.on('data', (data) => {
	const output = data.toString().trim();
	if (output) {
		try {
			// Try to parse as JSON for better formatting
			const jsonOutput = JSON.parse(output);
			console.log('\nServer response:', JSON.stringify(jsonOutput, null, 2));
		} catch (e) {
			// If not valid JSON, just output as is
			console.log('\nServer output:', output);
		}
	}
});

// Send a request to the server
function sendRequest(request) {
	const jsonRequest = JSON.stringify(request);
	mcpServer.stdin.write(jsonRequest + '\n');
}

// Examples of requests
const exampleRequests = {
	conversations: {
		id: '1',
		type: 'request',
		method: 'tools.read_omi_conversations',
		params: {
			user_id: TEST_USER_ID,
			limit: 5,
		},
	},
	memories: {
		id: '2',
		type: 'request',
		method: 'tools.read_omi_memories',
		params: {
			user_id: TEST_USER_ID,
			limit: 5,
		},
	},
	createConversation: {
		id: '3',
		type: 'request',
		method: 'tools.create_omi_conversation',
		params: {
			user_id: TEST_USER_ID,
			text: 'This is a test conversation',
			text_source: 'message',
		},
	},
};

// Display menu and handle user choice
function showMenu() {
	console.log('\n=== Omi MCP Test Client ===');
	console.log('1. Get conversations');
	console.log('2. Get memories');
	console.log('3. Create a conversation');
	console.log('q. Quit');

	rl.question('\nChoose an option: ', (answer) => {
		if (answer === 'q') {
			mcpServer.kill();
			rl.close();
			return;
		}

		switch (answer) {
			case '1':
				console.log('Fetching conversations...');
				sendRequest(exampleRequests.conversations);
				break;
			case '2':
				console.log('Fetching memories...');
				sendRequest(exampleRequests.memories);
				break;
			case '3':
				console.log('Creating a conversation...');
				sendRequest(exampleRequests.createConversation);
				break;
			default:
				console.log('Invalid option');
		}

		// Show menu again after short delay
		setTimeout(showMenu, 1000);
	});
}

// Give the server a moment to start up
setTimeout(() => {
	console.log('MCP test client started. Press Ctrl+C to exit.');
	console.log(`Using test user ID: ${TEST_USER_ID}`);
	showMenu();
}, 1000);

// Handle exit
process.on('SIGINT', () => {
	mcpServer.kill();
	rl.close();
	process.exit(0);
});
