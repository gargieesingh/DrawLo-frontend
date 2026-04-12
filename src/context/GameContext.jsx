'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';
import socket from '../socket/socket';

const GameContext = createContext(null);

const initialState = {
  // Player
  playerName: '',
  playerAvatar: '🦁', // Default avatar
  playerId: '',

  // Room
  roomCode: '',
  players: [],
  isHost: false,
  settings: { maxPlayers: 8, rounds: 3, drawTime: 80 },

  // Game state
  gameStatus: 'waiting',
  currentDrawer: null,
  round: 0,
  totalRounds: 3,

  // Drawing turn
  wordHint: '',
  wordLength: 0,
  timeLeft: 0,
  isMyTurn: false,
  myWord: '',

  // Drawing Tools
  currentTool: 'pen',
  currentColor: '#000000',
  currentSize: 5,

  // Word picker
  wordChoices: [],
  showWordPicker: false,

  // Chat
  messages: [],

  // End states
  turnResult: null,
  gameResult: null,

  // Error
  error: null,

  // Private guess word
  guessedWord: null,

  // Auto-start countdown (null = inactive, number = seconds remaining)
  countdown: null,

  // How user joined: true = Quick Play, false = private room
  isQuickPlay: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PLAYER':
      return { ...state, playerName: action.name, playerAvatar: action.avatar || state.playerAvatar, playerId: action.id };

    case 'SET_QUICK_PLAY':
      return { ...state, isQuickPlay: action.value };

    case 'SET_ROOM_CODE':
      return { ...state, roomCode: action.code };

    case 'ROOM_UPDATE': {
      const room = action.room;
      // socket.id might have been undefined initially, so we capture it here
      const myId = socket.id || state.playerId;
      const incomingStatus = room.state?.status || state.gameStatus;
      // If the game was restarted (reset to 'waiting' then 'picking'), clear result state
      const isReset = incomingStatus === 'waiting' || incomingStatus === 'picking';
      return {
        ...state,
        playerId: myId,
        players: room.players || [],
        isHost: room.host === myId,
        settings: room.settings || state.settings,
        gameStatus: incomingStatus,
        currentDrawer: room.state?.currentDrawer || null,
        round: room.state?.round || 0,
        totalRounds: room.settings?.rounds || state.totalRounds,
        timeLeft: room.state?.timeLeft ?? state.timeLeft,
        roomCode: room.code || state.roomCode,
        isMyTurn: room.state?.currentDrawer === myId,
        // Clear overlays when game resets
        gameResult: isReset ? null : state.gameResult,
        turnResult: isReset ? null : state.turnResult,
      };
    }

    case 'TURN_START':
      return {
        ...state,
        round: action.round,
        totalRounds: action.totalRounds,
        currentDrawer: { id: action.drawerID, name: action.drawerName },
        isMyTurn: action.drawerID === state.playerId,
        wordHint: '',
        wordLength: 0,
        myWord: '',
        turnResult: null,
        guessedWord: null,
        gameStatus: 'picking',
        countdown: null,
      };

    case 'YOUR_TURN_TO_DRAW':
      return {
        ...state,
        wordChoices: action.wordChoices,
        showWordPicker: true,
        isMyTurn: true,
      };

    case 'WORD_CHOSEN':
      return {
        ...state,
        wordHint: action.hint,
        wordLength: action.wordLength,
        showWordPicker: false,
        wordChoices: [],
        gameStatus: 'drawing',
      };

    case 'YOUR_WORD':
      return { ...state, myWord: action.word };

    case 'HINT_UPDATE':
      return { ...state, wordHint: action.hint };

    case 'TIMER_TICK':
      return { ...state, timeLeft: action.timeLeft };

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };

    case 'SET_TOOL':
      return { ...state, currentTool: action.tool };
      
    case 'SET_COLOR':
      return { ...state, currentColor: action.color };
      
    case 'SET_SIZE':
      return { ...state, currentSize: action.size };

    case 'TURN_END':
      return {
        ...state,
        gameStatus: 'turnEnd',
        turnResult: { word: action.word, players: action.players },
        myWord: '',
        guessedWord: null,
      };

    case 'YOU_GUESSED_CORRECTLY':
      return {
        ...state,
        guessedWord: action.word,
      };

    case 'CLEAR_TURN_RESULT':
      return { ...state, turnResult: null };

    case 'GAME_END':
      return {
        ...state,
        gameStatus: 'gameEnd',
        gameResult: { players: action.players, winner: action.winner },
        turnResult: null,
        countdown: null,
      };

    case 'GAME_ABORTED':
      return {
        ...state,
        gameStatus: 'waiting',
        turnResult: null,
        gameResult: null,
        myWord: '',
        guessedWord: null,
        wordChoices: [],
        showWordPicker: false,
        countdown: null,
        messages: [
          ...state.messages,
          { id: 'system', name: '', text: action.reason, type: 'system' },
        ],
      };

    case 'COUNTDOWN_TICK':
      return { ...state, countdown: action.seconds };

    case 'COUNTDOWN_CANCELLED':
      return { ...state, countdown: null };

    case 'SET_ERROR':
      return { ...state, error: action.message };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'RESET':
      return {
        ...initialState,
        playerName: state.playerName,
        playerAvatar: state.playerAvatar,
        playerId: state.playerId,
      };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addMessage = useCallback((message) => {
    dispatch({ type: 'ADD_MESSAGE', message: { ...message, _id: Date.now() + Math.random() } });
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, addMessage }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}
