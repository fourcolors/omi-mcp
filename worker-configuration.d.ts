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
