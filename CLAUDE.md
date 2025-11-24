# StreamPrep - VDO.ninja Room Setup Tool

## Project Overview

StreamPrep is a full-stack TypeScript application that simplifies the creation and management of VDO.ninja video streaming rooms. It automatically generates unique room names and provides easy setup for multiple devices to join the same VDO.ninja room with optimized streaming settings.

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Socket.IO server (v4.8.1) for real-time communication
- **Development**: ts-node-dev for hot-reloading during development
- **Port**: 3000 (with CORS allowing http://localhost:5174)

### Frontend
- **Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.2
- **UI Library**: React Bootstrap 2.10 with Bootstrap 5.3
- **Icons**: React Icons 5.5
- **Real-time Communication**: Socket.IO Client 4.8.1
- **Port**: 5174 (Vite dev server)

### Shared
- TypeScript interfaces and types shared between frontend and backend
- Located in `/shared` directory

## Project Structure

```
StreamPrep/
├── backend/
│   └── src/
│       ├── index.ts          # Socket.IO server setup
│       ├── Client.ts         # Client class and event handlers
│       ├── Room.ts           # Room class and event handlers
│       └── generateWord.ts   # Random word generation for names
├── frontend/
│   └── src/
│       ├── App.tsx           # Main React component
│       ├── main.tsx          # React entry point
│       ├── socket.ts         # Socket.IO client setup
│       └── classes/
│           ├── Client.ts     # Frontend Client class
│           └── Room.ts       # Frontend Room class
└── shared/
    ├── Client.ts             # Client interfaces and types
    ├── Room.ts               # Room interfaces and types
    └── Socket-Types.ts       # Socket event type definitions
```

## Core Concepts

### Client System

**Backend Client** (`backend/src/Client.ts`):
- Represents a connected device/user
- Automatically generates a unique name using random word API
- Properties: `id` (socket.id), `name`, `room` (optional)
- Event handlers:
  - `HELLO`: Initial greeting when client connects
  - `RENAME`: Change client name (manual or auto-generated)
- Room setter: When `room` is set, automatically sends `ROOM_JOIN` client event (does NOT send ROOM_LEAVE)

**Frontend Client** (`frontend/src/classes/Client.ts`):
- Mirrors backend client data on the frontend
- Handles incoming socket events from server (HELLO, RENAME)
- Uses `useRef` pattern to avoid React closure issues with socket listeners

### Room System

**Backend Room** (`backend/src/Room.ts`):
- Manages a collection of clients who want to stream together
- Generates unique room names using random words
- Properties: `id`, `name`, `clients[]`
- Event handlers:
  - `CREATE`: Create new room (with optional custom name), sends UPDATE to all members
  - `UPDATE`: Request current room state (used with callbacks)
  - `JOIN`: Join existing room by name, adds client and sends UPDATE to all members
  - `LEAVE`: Emits room LEAVE event to client, then sets `client.room = undefined`
  - `LINK`: Generate and broadcast VDO.ninja link to all room members
- Automatically closes when last client leaves

**Frontend Room** (`frontend/src/classes/Room.ts`):
- Mirrors backend room data on the frontend
- Handles incoming socket events from server (CREATE, UPDATE, JOIN, LEAVE)
- Uses `useRef` pattern to avoid React closure issues with socket listeners
- LEAVE event sets room state to `null`, triggering UI update

**VDO.ninja Link Generation**:
The backend generates a base URL and broadcasts it to all room members via the LINK event:
```
https://vdo.ninja/?room=${roomName}&autostart&ee&od&proaudio=1
```

Each client then appends their selected device parameters:
- `&videodevice=${formattedLabel}` or `&videodevice=0` (if disabled)
- `&audiodevice=${formattedLabel}` or `&audiodevice=0` (if disabled)

Base parameters:
- `room`: Unique room name
- `autostart`: Auto-start camera/mic
- `ee`: Enhanced audio/video
- `od`: Optimize for low delay
- `proaudio=1`: High quality audio

Device label formatting:
- Convert to lowercase
- Replace all non-alphanumeric characters with underscores
- Collapse multiple consecutive underscores into single underscore
- Example: "Default - Microphone (2- Usb Microphone)" → "default_microphone_2_usb_microphone"

### Socket Communication

The app uses Socket.IO with typed events for type-safe real-time communication:

**Event Channels**:
- `client`: For client-specific events (HELLO, RENAME, ROOM_JOIN, ROOM_LEAVE)
- `room`: For room-specific events (CREATE, UPDATE, JOIN, LEAVE, LINK)

**Type Safety**:
- `ClientToServerEvents`: Events client can send to server
- `ServerToClientEvents`: Events server can send to client
- `InterServerEvents`: Events between multiple server instances
- `SocketData`: Additional socket metadata

### Word Generation

`backend/src/generateWord.ts` uses a random words API to generate unique, readable names:
- API: https://random-words-api.kushcreates.com
- Filters: 7 letters, lowercase, English, single word
- Validation: Minimum 5 characters, no spaces
- Retries automatically if validation fails

## Key Features & Implementation Details

### Device Selection & Media Permissions

**Media Device Enumeration**:
- On app load, requests camera and microphone permissions via `getUserMedia()`
- Immediately stops all tracks after permission granted (only needs permission, not active stream)
- Enumerates all available video and audio input devices
- Listens for `devicechange` events to update device lists when hardware changes
- Device labels only available after permissions granted

**Device State Management**:
- `selectedCamera`: Currently selected camera deviceId or "disabled"
- `selectedMicrophone`: Currently selected microphone deviceId or "disabled"
- `cameras`: Array of available video input devices (MediaDeviceInfo[])
- `microphones`: Array of available audio input devices (MediaDeviceInfo[])
- Uses `useRef` pattern for device arrays to pass to Room.handleEvents without closure issues

**Send Link Flow**:
- User clicks "Send Link" button while in a room
- Frontend sends LINK event to backend (no data needed)
- Backend broadcasts base VDO.ninja URL to all room members
- Each client:
  1. Receives the base URL
  2. Finds their selected devices in the device arrays by deviceId
  3. Formats device labels (lowercase, non-alphanumeric → underscore, collapse multiple underscores)
  4. Appends formatted device parameters to URL
  5. Navigates to the personalized VDO.ninja URL in current tab
- All clients end up in the same VDO.ninja room with their individual device selections

### React State Management in App.tsx

The main App component uses several state management patterns:

1. **useRef for Socket Listeners**:
   - `localClientRef` keeps the current client value accessible inside socket event listeners
   - `roomRef` keeps the current room value accessible inside socket event listeners
   - `selectedDevicesRef` keeps current device selections (videodevice, audiodevice)
   - `camerasRef` and `microphonesRef` keep device arrays accessible
   - Prevents stale closure issues where socket callbacks capture old state values
   - Updated in useEffect whenever state changes

2. **Dual State Pattern (Client)**:
   - `localClient`: Source of truth from server
   - `clientData`: Local editable copy for form inputs
   - When `localClient` updates, `clientData` syncs automatically

3. **Room State**:
   - `room`: Current room state (null when not in a room)
   - `roomNameInput`: Local input state for joining rooms by name
   - Room state managed through socket events, no local editing needed

4. **Key Prop for Input Remounting**:
   - Input field uses `key={localClient.id + localClient.name}`
   - Forces React to remount input when name changes from server
   - Ensures UI reflects server state changes immediately

### Connection Flow

1. **Initial Connection**:
   - Frontend connects to Socket.IO server on mount
   - Backend creates Client instance with socket
   - Backend generates random name via API
   - Backend sends `HELLO` event with client data
   - Frontend receives client data and stores it

2. **Room Creation Flow**:
   - User clicks "Create Room" button
   - Frontend sends `room` event with `CREATE` type and no data
   - Backend creates new Room instance with auto-generated name
   - Backend calls `newClient()` which joins client to Socket.IO room
   - Backend sets `client.room = this` (triggers ROOM_JOIN client event)
   - Backend calls `sendUpdate()` which broadcasts UPDATE to all room members
   - Frontend Room class receives UPDATE event and creates Room instance
   - UI switches to "in room" view showing room name and client list

3. **Room Join Flow**:
   - User enters room name and clicks "Join Room" button
   - Frontend sends `room` event with `JOIN` type and `{name: roomName}`
   - Backend finds room by name
   - Backend calls `room.newClient(client)` which adds client to room
   - Backend sends UPDATE event to all room members (including new client)
   - Frontend Room class receives UPDATE/JOIN event and creates Room instance
   - UI switches to "in room" view

4. **Room Leave Flow**:
   - User clicks "Leave Room" button
   - Frontend sends `room` event with `LEAVE` type
   - Backend emits room LEAVE event to the specific client
   - Backend sets `client.room = undefined` (triggers room removal)
   - Frontend Room class receives LEAVE event and calls `reactCallback(null)`
   - Room state becomes null, UI switches back to "not in room" view
   - Backend calls `removeClient()` which sends UPDATE to remaining members

5. **Rename Flow**:
   - User clicks reload button or edits name
   - Frontend sends `client` event with `RENAME` type
   - Backend generates new name (or uses provided name)
   - Backend updates client name
   - If client is in a room, backend calls `room.sendUpdate()` to notify all members
   - Backend sends `RENAME` response back to client
   - Frontend creates new Client instance (new reference)
   - React detects change and updates UI

## Important Patterns & Gotchas

### React Closure Issue
Socket event listeners capture state values when registered. Use `useRef` to always access current values:
```typescript
const localClientRef = useRef<Client | null>(null);
socket.on('client', (ev, data, cb) =>
  Client.handleEvents(localClientRef.current, setLocalClient, ev, data, cb)
);
```

### React State Updates
Always create new object instances when updating state to trigger re-renders:
```typescript
// GOOD - new instance
const updatedClient = new Client({id: client._id, name: newName});
reactCallback(updatedClient);

// BAD - mutates existing instance
client._name = newName;
reactCallback(client); // Same reference, React won't re-render
```

### Socket.IO Room Pattern
Backend uses Socket.IO rooms for efficient broadcasting:
```typescript
socket.join(roomName);  // Client joins room
io.to(roomName).emit('room', eventType, data);  // Broadcast to all in room
```

## Docker Deployment

The application is fully containerized using Docker and Docker Compose.

### Architecture

**Docker Setup**:
- **Backend Container**: Node.js app running Socket.IO server on port 3000 (internal)
- **Frontend Container**: Nginx serving static React build on port 80 (mapped to host 3011)
- **Network**: Both containers communicate on `streamprep-network` (bridge driver)

**Nginx Proxy Configuration** (`frontend/nginx.conf`):
- Frontend served from nginx on port 80
- Socket.IO requests (`/socket.io/`) proxied to backend container (`http://backend:3000`)
- WebSocket upgrade headers configured for Socket.IO compatibility
- Buffering and caching disabled for real-time communication

**Key Configuration Details**:
1. Frontend connects to same origin (no CORS issues)
2. Nginx forwards Socket.IO traffic to backend using Docker's internal DNS
3. Backend binds to all interfaces (`0.0.0.0`) for Docker networking
4. CORS configured for `http://localhost:3011` origin

### Docker Commands

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild specific service
docker-compose build backend
docker-compose build frontend

# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs -f  # Follow logs

# Check running containers
docker-compose ps
```

### Port Mappings

- **Frontend**: `http://localhost:3011` (host:3011 → container:80)
- **Backend**: Internal only (container:3000, not exposed to host)

### Environment Variables

**Backend** (`docker-compose.yml`):
- `CORS_ORIGIN`: Set to `http://localhost:3011` for production

**Frontend** (`.env.production`):
- `VITE_SERVER`: Set to `/api` to indicate proxy mode (though path is always `/socket.io/`)

**Socket.IO Client Configuration** (`frontend/src/socket.ts`):
- When `VITE_SERVER` is set: Connects to same origin (`http://localhost:3011`)
- Uses default Socket.IO path (`/socket.io/`)
- Nginx proxies to backend container

## Development Commands

### Local Development (without Docker)

**Backend**:
```bash
cd backend
npm run dev    # Start backend with hot-reload on port 3000
```

**Frontend**:
```bash
cd frontend
npm run dev    # Start Vite dev server on port 5174
npm run build  # Build for production
npm run lint   # Run ESLint
```

### Development vs Production Socket Configuration

**Development** (local):
- Frontend: `http://localhost:5174`
- Backend: `http://localhost:3000`
- Direct connection, CORS enabled for localhost:5174

**Production** (Docker):
- Frontend: `http://localhost:3011`
- Backend: Internal (`http://backend:3000`)
- Nginx proxy, CORS enabled for localhost:3011

## Future Enhancement Ideas

- Persistent rooms (database storage)
- Room passwords/access control
- Room history and analytics
- Custom VDO.ninja URL parameters
- Multiple room management
- Screen sharing controls
- Recording integration
- Chat functionality
- User authentication
- Room templates with preset configurations