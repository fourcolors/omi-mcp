# Omi MCP Local Development Guide

## Commands
- Build: `npm run build`
- Dev mode: `npm run dev`
- Start server: `npm run start`
- Test: `npm run test` or `node test-mcp-client.js`
- Clean: `npm run clean`
- Rebuild: `npm run rebuild`

## Code Style
- TypeScript with strict type checking
- Use tabs for indentation
- Line length maximum: 140 characters
- Use single quotes for strings
- End statements with semicolons
- Use Zod for API parameter validation
- Use JSDoc comments for public methods

## Error Handling
- Use try/catch blocks around async operations
- Log errors before throwing
- Provide detailed error messages
- Handle cleanup on process exit

## Naming Conventions
- PascalCase for interfaces and types
- camelCase for variables and functions
- Descriptive variable names
- Consistent parameter naming

## Logging
- Use the custom log function for all logging
- Include timestamps in log messages
- Log both to stderr and log file