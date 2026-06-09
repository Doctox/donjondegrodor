import { GAME_TEXTS } from "../data/gameTexts";

export type DoorId = "left" | "center" | "right";

export type GameState = {
  life: number;
  gold: number;
  attempt: number;
  floor: number;
  lastEvent: string;
  selectedDoor?: DoorId;
};

type Listener = (state: GameState) => void;

const initialState: GameState = {
  life: 3,
  gold: 0,
  attempt: 1,
  floor: 1,
  lastEvent: GAME_TEXTS.legacyRun.initialEvent
};

const doorEvents: Record<DoorId, Omit<Partial<GameState>, "selectedDoor"> & { text: string }> = {
  left: { gold: 7, text: GAME_TEXTS.legacyRun.leftDoor },
  center: { life: 2, floor: 2, text: GAME_TEXTS.legacyRun.centerDoor },
  right: { gold: 3, floor: 2, text: GAME_TEXTS.legacyRun.rightDoor }
};

let state: GameState = { ...initialState };
const listeners = new Set<Listener>();

export function getGameState(): GameState {
  return { ...state };
}

export function subscribeGameState(listener: Listener): () => void {
  listeners.add(listener);
  listener(getGameState());
  return () => listeners.delete(listener);
}

export function chooseDoor(doorId: DoorId): GameState {
  const event = doorEvents[doorId];
  state = {
    ...state,
    life: event.life ?? state.life,
    gold: event.gold ?? state.gold,
    floor: event.floor ?? state.floor,
    attempt: state.attempt + 1,
    selectedDoor: doorId,
    lastEvent: event.text
  };
  emit();
  return getGameState();
}

export function resetGameState(): GameState {
  state = { ...initialState };
  emit();
  return getGameState();
}

function emit(): void {
  const snapshot = getGameState();
  listeners.forEach((listener) => listener(snapshot));
}
