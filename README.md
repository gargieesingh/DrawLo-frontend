# DrawLo Frontend

The frontend client for DrawLo, a real-time multiplayer drawing and guessing game. 

Live at: [drawlo.fun](https://drawlo.fun)

## What is this?

It's a Pictionary-style web game where players take turns drawing a given word while others try to guess it as fast as possible. This repo contains the Next.js client which handles the UI, canvas interactions, and connects to a custom Socket.IO backend for real-time multiplayer synchronization.

## Stack

- Next.js (App Router)
- React 19
- Tailwind CSS v4
- Socket.IO Client

## Local Development

1. Clone the repo and install dependencies:
```bash
git clone https://github.com/gargieesingh/DrawLo-frontend.git
cd DrawLo-frontend
npm install
```

2. Set up your `.env.local`:
```env
# Points to your local or deployed Socket.IO backend
NEXT_PUBLIC_SOCKET_URL=http://localhost:3500 
```

3. Spin up the dev server:
```bash
npm run dev
```

App should now be running on `http://localhost:3000`.

## How it works under the hood

- **Real-time Sync**: A persistent Socket.IO connection is used to broadcast canvas coordinates, chat messages, and game loop events (timers, turns, round ends) across clients with minimal latency.
- **State Management**: The core game state (players, scores, current turn, drawing data) is managed via a React Context (`GameContext`) paired with a reducer. This keeps the state centralized and accessible to the canvas, chat, and lobby components without prop drilling.
- **Game Modes**: 
  - Quick Play matches players into public rooms automatically (`quick_play` event).
  - Private rooms can be generated and joined via a 5-character code (`create_room` / `join_room` events).

## Author

[Gargie](https://github.com/gargieesingh)
