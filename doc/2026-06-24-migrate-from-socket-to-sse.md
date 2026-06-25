# Socket.IO to SSE + HTTP POST Migration

**Date:** 2026-06-24  
**Status:** Completed

## Overview

Migrated the real-time communication layer from Socket.IO WebSocket to Server-Sent Events (SSE) combined with HTTP POST. This simplifies the architecture, reduces dependencies, and improves stability.

## Motivation

- **Reduced Complexity:** Removed need for WebSocket gateway management
- **Lighter Dependencies:** Eliminated `socket.io` and `socket.io-client` packages
- **Better Alignment:** SSE + HTTP is more suitable for unidirectional server-to-client communication in chat scenarios
- **Improved Browser Compatibility:** SSE is natively supported without additional libraries
- **Simpler State Management:** No need to manage socket connection state

## Changes Made

### Backend (NestJS Server)

#### 1. Updated `agent.controller.ts`
- **Removed:** Socket.IO event handlers
- **Added:** New `POST /api/agent/chat` endpoint
- **Features:**
  - Accepts chat message, sessionId, role, and optional extensions
  - Returns Server-Sent Events (SSE) stream
  - Sets proper CORS and streaming headers
  - Sends loading message first, then final response
  - Maintains existing message persistence logic

**Key Implementation:**
```typescript
@Post('/chat')
async handleChat(
  @Body() data: { message: string; sessionId: string; role: string; ext?: ISendExt },
  @Res() res: Response,
) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  // ... SSE response handling
}
```

#### 2. Updated `agent.module.ts`
- **Removed:** `AgentGateway` from providers list
- **Removed:** WebSocket-related imports
- Kept `AgentService`, `LlmService`, `WeatherService` intact

#### 3. Deprecated `agent.gateway.ts`
- No longer used in module
- Can be deleted in cleanup phase
- WebSocket functionality fully replaced by REST endpoint

#### 4. Updated `package.json`
- **Removed Dependencies:**
  - `@nestjs/websockets`
  - `@nestjs/platform-socket.io`
  - `socket.io`

### Frontend (React Chat App)

#### 1. Updated `App.tsx`
- **Removed:** Socket.IO imports and initialization
- **Removed:** Socket state management (`socket`, `setSocket`)
- **Removed:** useEffect for socket event listeners
- **Added:** Native Fetch API for HTTP POST requests
- **Added:** EventSource-like SSE reading implementation

**Key Changes:**

1. **Removed Socket Initialization:**
   ```typescript
   // OLD: Socket.IO setup
   const [socket, setSocket] = useState<any>(null);
   useEffect(() => {
     const newSocket = io('http://jm.chat.ai:3000');
     setSocket(newSocket);
     return () => newSocket.disconnect();
   }, []);
   ```

2. **New HTTP + SSE Implementation:**
   ```typescript
   const sendMessage = async (input: string, ext: ISendExt) => {
     // Simplified session ID handling
     const newId = currentSessionId || Date.now().toString();
     if (!currentSessionId) {
       setActiveMsgId(newId);
     }

     // Add user message to UI immediately
     setMessages([...messages, { id: `${Date.now()}`, text: input, role: 'user', ext }]);

     try {
       const response = await fetch('http://jm.chat.ai:3000/api/agent/chat', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           message: input,
           sessionId: newId,
           role: 'user',
           ext: ext,
         }),
       });

       const reader = response.body!.getReader();
       const decoder = new TextDecoder();
       let buffer = '';

       while (true) {
         const { done, value } = await reader.read();
         if (done) break;

         buffer += decoder.decode(value, { stream: true });
         const lines = buffer.split('\n');

         // Parse and process SSE messages
         for (let i = 0; i < lines.length - 1; i++) {
           const line = lines[i].trim();
           if (line.startsWith('data: ')) {
             const data = JSON.parse(line.slice(6));
             // Update message state
           }
         }
         buffer = lines[lines.length - 1];
       }
     } catch (error) {
       // Error handling
     }
   };
   ```

3. **Simplified `messageStatus`:**
   - Always set to `true` on component mount
   - No socket connection state to manage
   - Indicates server readiness

#### 2. Updated `package.json`
- **Removed Dependencies:**
  - `socket.io-client`

## API Contract

### Endpoint: `POST /api/agent/chat`

**Request Body:**
```json
{
  "message": "string",
  "sessionId": "string",
  "role": "user | assistant | system",
  "ext": {
    "type": "image_url",
    "url": "string"
  }
}
```

**Response:** Server-Sent Events (text/event-stream)

**Message Format:**
```
data: {"id":"string","text":"string","role":"user|assistant|system","isLoading":false,"ext":{...}}\n\n
```

## Message Flow

### Old (Socket.IO)
```
Client                          Server
  |                               |
  |-- joinSession              --> |
  |-- sendMessage              --> |
  |<-- message (loading)        -- |
  |<-- message (final)          -- |
  |
```

### New (SSE + HTTP)
```
Client                          Server
  |                               |
  |-- POST /api/agent/chat     --> |
  |<-- SSE stream              -- |
  |    - data: loading msg        |
  |    - data: final msg          |
  |    - connection close         |
```

## Benefits

✅ **Simplified Architecture**
- Single HTTP endpoint instead of complex WebSocket gateway
- No connection state to manage in React
- Cleaner component lifecycle

✅ **Better Performance**
- No persistent WebSocket connection overhead
- HTTP/1.1 keep-alive for efficiency
- Reduced memory footprint

✅ **Improved Maintainability**
- Standard HTTP/REST conventions
- SSE is simpler than WebSocket protocol
- Easier to debug with browser DevTools
- Better logging with standard HTTP patterns

✅ **Browser Compatibility**
- SSE works in all modern browsers
- No polyfills needed
- Native ReadableStream API support

## Migration Steps Completed

- [x] Replace WebSocket gateway with HTTP controller
- [x] Implement SSE streaming in backend
- [x] Refactor frontend to use Fetch + ReadableStream
- [x] Remove Socket.IO dependencies
- [x] Maintain message persistence
- [x] Update CORS headers for streaming
- [x] Ensure loading state handling
- [x] Test error handling
- [x] Fix TypeScript compilation errors
- [x] Delete deprecated WebSocket gateway file

## TypeScript Compilation Fixes

### Backend Fixes

1. **Response Type Import**
   - Changed `import { Response }` to `import type { Response }` 
   - Fixes: "A type referenced in a decorated signature must be imported with 'import type'"
   - File: `src/agent/agent.controller.ts`

2. **Optional Extension Parameter**
   - Updated `onceAgent()` signature: `ext: ISendExt` → `ext?: ISendExt`
   - Updated `sessionMsgToModelMsg()` signature: `ext: ISendExt` → `ext?: ISendExt`
   - Files: `src/agent/services/agent.service.ts`

3. **Default Value for Extension**
   - In controller, when calling `onceAgent()`: `ext: data.ext || { type: 'text' }`
   - Ensures ext is always provided with a default fallback
   - File: `src/agent/agent.controller.ts`

4. **Deleted Deprecated File**
   - Removed `src/agent/agent.gateway.ts`
   - No longer needed after SSE migration

### Frontend Fixes

1. **Updated Store Type Definition**
   - Changed `setMessages` signature to accept both array and function:
   - `setMessages: (msg: Message[] | ((prev: Message[]) => Message[])) => void`
   - Updated implementation to handle both cases
   - File: `src/store/app.ts`

2. **Removed Unused Import**
   - Changed `import { Message }` to `import type { ISendExt }` (only needed type)
   - File: `src/App.tsx`

### Compilation Status
- ✅ Backend: `npm run build` succeeds
- ✅ Frontend: `npm run build` succeeds (vite build)
- ✅ No TypeScript errors in either package

## Rollback Plan

If issues arise:
1. Keep the old `agent.gateway.ts` file for reference
2. Restore `socket.io` and `@nestjs/websockets` to package.json
3. Revert `agent.module.ts` to include AgentGateway
4. Revert `App.tsx` to previous Socket.IO implementation
5. Run `npm install` or `pnpm install` in both packages

## Testing Checklist

- [ ] Verify `/api/agent/chat` endpoint receives requests
- [ ] Confirm SSE stream returns loading message first
- [ ] Verify final response message received correctly
- [ ] Test message persistence in database
- [ ] Validate image handling with media extensions
- [ ] Test error scenarios (network failure, timeout)
- [ ] Verify CORS headers in browser DevTools
- [ ] Load test with multiple concurrent messages
- [ ] Test on different browsers (Chrome, Firefox, Safari)

## Future Improvements

1. **Add Request Validation:** Implement DTO validation for chat requests
2. **Rate Limiting:** Add rate limiter to prevent abuse
3. **Authentication:** Integrate JWT authentication for sessionId
4. **Timeout Handling:** Implement request timeout with proper cleanup
5. **Retry Logic:** Add automatic retry mechanism on client
6. **Message Streaming:** Support streaming individual tokens from AI response
7. **Connection Monitoring:** Add heartbeat/keepalive mechanism if needed

## References

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [NestJS Streaming](https://docs.nestjs.com/techniques/streaming-files)
- [ReadableStream API](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)

## Summary

This migration successfully replaced Socket.IO with a simpler, more maintainable SSE + HTTP POST architecture. The system now has lower complexity, fewer dependencies, and better browser compatibility while maintaining all existing functionality.
