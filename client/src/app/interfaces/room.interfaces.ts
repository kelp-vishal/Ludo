import { IGameState } from './ludoboard.interfaces';

export interface IRoomPlayer {
  socketId: string;
  color?: string;
  playerName?: string;
}
export interface IRemoteGameState {
  updatedBy: string;
  gameState: IGameState;
  timestamp: string;
}
