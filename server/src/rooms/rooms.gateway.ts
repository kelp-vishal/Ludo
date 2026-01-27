import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IData, IGameRoom } from 'src/interfaces/roomsGateway.interfaces';
import { Colors } from '../common/enum/roomsGateway.enum';
import { GameLogicService } from 'src/game/game-logic.service';
import { GameStateService } from 'src/game/game-state.service';

@WebSocketGateway({
  path: '/socket.io',
  cors: {
    origin: '*',
    method: ['GET', 'POST'],
  },
  transports: ['websocket'],
})
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  // GameRoom :IGameRoom[]=[];
  private readonly logger = new Logger(RoomsGateway.name);

  private rooms: Map<string, IGameRoom> = new Map();
  private playerRooms: Map<string, string> = new Map();
  private roomColorIndex: Map<string, number> = new Map();
  colors: Colors[] = [Colors.RED, Colors.BLUE, Colors.GREEN, Colors.YELLOW];

  constructor(
    private readonly gameLogicService: GameLogicService,
    private readonly gameStateService: GameStateService,
  ) {}

  handleConnection(client: Socket): void {
    this.logger.log(`New user Connected :,${client.id}`);
    client.emit('connected', {
      socketId: client.id,
      message: 'Connected successfully',
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`User disconnected:, ${client.id}`);

    const roomId = this.playerRooms.get(client.id);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) {
      this.playerRooms.delete(client.id);
      return;
    }

    // Find the disconnecting Player's color
    const disconnectingPlayer = room.players.find(
      (p) => p.socketId === client.id,
    );
    const playerColor = disconnectingPlayer?.color;

    room.players = room.players.filter((p) => p.socketId !== client.id);
    room.currentPlayers = Math.max(0, room.currentPlayers - 1);

    if (room.currentPlayers === 0) {
      this.rooms.delete(roomId);
      this.roomColorIndex.delete(roomId);
      this.gameStateService.deleteGameState(roomId);
      this.logger.log(`Room ${roomId} deleted , all Players left the room..`);
    } else {
      if (room.hostSocketId === client.id) {
        room.hostSocketId = room.players[0]?.socketId;
      }

      // Handle game state if game has started
      if (room.gameStarted && playerColor) {
        const gameState = this.gameStateService.removePlayer(
          roomId,
          playerColor,
        );

        // End game if less than 2 players remain
        if (room.currentPlayers < 2) {
          room.gameStarted = false;
          this.gameStateService.deleteGameState(roomId);
          this.logger.log(`Game ended in room ${roomId}`);

          this.server.to(roomId).emit('game-ended', {
            roomId,
            room,
            reason: 'Player disconnected - less players to continue',
            socketId: client.id,
          });
        } else {
          // Game continues with remaining players
          this.logger.log(
            `Player ${playerColor} removed from active game in room ${roomId}`,
          );

          this.server.to(roomId).emit('player-left', {
            roomId,
            room,
            gameState,
            socketId: client.id,
            playerColor,
            message: `${playerColor} player disconnected. Game continues.`,
          });
        }
      } else {
        // If game not started yet
        this.server.to(roomId).emit('player-left', {
          roomId,
          room,
          socketId: client.id,
        });
      }

      // Broadcast updated rooms list
      this.server.emit('rooms-list', {
        rooms: Array.from(this.rooms.values()),
      });

      this.server.to(roomId).emit('player-left', {
        roomId,
        room,
        socketId: client.id,
      });
    }

    this.playerRooms.delete(client.id);
  }

  @SubscribeMessage('create-room')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: IData,
  ): void {
    const roomId = this.generateRoomId();
    const room: IGameRoom = {
      roomId,
      players: [
        {
          socketId: client.id,
          playerName: data.playerName,
          color: 'RED',
        },
      ],
      maxPlayers: data.playerCount,
      currentPlayers: 1,
      gameStarted: false,
      hostSocketId: client.id,
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(client.id, roomId);

    this.roomColorIndex.set(roomId, 1);

    client.join(roomId);

    this.logger.log(`Room created: ${roomId} with host ${client.id}`);
    client.emit('room-created', {
      room,
      message: `Room created successfully with ID: ${roomId}`,
    });

    // Broadcast to all clients about new room
    this.server.emit('rooms-list', {
      rooms: Array.from(this.rooms.values()),
    });
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: IData,
  ): void {
    const room = this.rooms.get(data.roomId);
    if (!room) {
      client.emit('room-error', {
        message: `Room ${data.roomId} not found`,
      });
      return;
    }

    if (room.gameStarted) {
      client.emit('room-error', {
        message: 'Game has already started in this room',
      });
      return;
    }

    if (room.currentPlayers >= room.maxPlayers) {
      client.emit('room-error', {
        message: `Room is full. Maximum players: ${room.maxPlayers}`,
      });
      return;
    }

    // Check if player is already in a room
    const existingRoom = this.playerRooms.get(client.id);
    if (existingRoom) {
      this.handleLeaveRoom(client);
    }

    // Assign color
    const currentColorIndex = this.roomColorIndex.get(data.roomId) || 0;
    const color = this.colors[currentColorIndex % this.colors.length];
    this.roomColorIndex.set(data.roomId, currentColorIndex + 1);

    room.players.push({
      socketId: client.id,
      playerName: data.playerName,
      color,
    });
    room.currentPlayers++;

    this.playerRooms.set(client.id, data.roomId);
    client.join(data.roomId);

    // Notify the joining player
    client.emit('room-joined', {
      room,
      message: `Successfully joined room ${data.roomId}`,
    });

    // Notify others in the room
    this.server.to(data.roomId).emit('player-joined', {
      roomId: data.roomId,
      room,
      message: `${data.playerName} (${client.id}) joined the room`,
      socketId: client.id,
    });

    // Broadcast updated rooms list
    this.server.emit('rooms-list', {
      rooms: Array.from(this.rooms.values()),
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket()
    client: Socket,
  ): void {
    const roomId = this.playerRooms.get(client.id);

    if (!roomId) {
      client.emit('room-error', {
        message: 'You are not in any room',
      });
      return;
    }

    const room = this.rooms.get(roomId);
    if (room) {
      room.players = room.players.filter((p) => p.socketId !== client.id);
      room.currentPlayers--;

      this.logger.log(`Player ${client.id} left room ${roomId}`);

      if (room.currentPlayers === 0) {
        this.rooms.delete(roomId);
        this.roomColorIndex.delete(roomId);
        this.logger.log(`Room ${roomId} deleted (empty)`);
      } else {
        // Transfer host if needed
        if (room.hostSocketId === client.id) {
          room.hostSocketId = room.players[0].socketId;
        }

        this.server.to(roomId).emit('player-left', {
          roomId,
          room,
          message: `Player ${client.id} left the room`,
          socketId: client.id,
        });
      }
    }

    client.leave(roomId);
    this.playerRooms.delete(client.id);

    // Broadcast updated rooms list
    this.server.emit('rooms-list', {
      rooms: Array.from(this.rooms.values()),
    });
  }

  @SubscribeMessage('get-rooms-list')
  handleGetRoomsList(@ConnectedSocket() client: Socket): void {
    const availableRooms = Array.from(this.rooms.values()).filter(
      (room) => !room.gameStarted && room.currentPlayers < room.maxPlayers,
    );

    client.emit('rooms-list', {
      rooms: availableRooms,
    });
  }

  @SubscribeMessage('start-game')
  handleStartGame(@ConnectedSocket() client: Socket): void {
    const roomId = this.playerRooms.get(client.id);

    if (!roomId) {
      client.emit('room-error', {
        message: 'You are not in any room',
      });
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('room-error', {
        message: 'Room not found',
      });
      return;
    }

    // Only host can start the game
    if (room.hostSocketId !== client.id) {
      client.emit('room-error', {
        message: 'Only the room host can start the game',
      });
      return;
    }

    room.gameStarted = true;

    this.logger.log(`Game started in room ${roomId}`);

    //Initialize game state on backend
    const playerColors = room.players.map((p) => p.color);
    const gameState = this.gameStateService.initializeGame(
      roomId,
      playerColors,
    );

    // Notify all players in the room
    this.server.to(roomId).emit('game-started', {
      room,
      gameState,
      message: `Game started with ${room.currentPlayers} players`,
      players: room.players,
    });

    // Broadcast updated rooms list
    this.server.emit('rooms-list', {
      rooms: Array.from(this.rooms.values()),
    });
  }

  @SubscribeMessage('game-state-update')
  handleGameStateUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { socketId: string; gameState: IGameRoom },
  ): void {
    const roomId = this.playerRooms.get(client.id);

    if (!roomId) {
      return;
    }

    // Broadcast game state to all players in the room
    this.server.to(roomId).emit('game-state-update', {
      gameState: data.gameState,
      updatedBy: client.id,
      timestamp: new Date(),
    });
  }

  @SubscribeMessage('newMessage')
  handleNewMessage(@MessageBody() message: string): void {
    this.server.emit('message', message);
  }

  @SubscribeMessage('roll-dice')
  handleRollDice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; socketId: string },
  ): void {
    const roomId = this.playerRooms.get(client.id);

    if (!roomId || roomId !== data.roomId) {
      client.emit('game-error', {
        message: 'You are not in this room',
      });
      return;
    }

    const gameState = this.gameStateService.getGameState(roomId);
    if (!gameState) {
      client.emit('game-error', {
        message: 'Game not started',
      });
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      client.emit('game-error', {
        message: 'Room not found',
      });
      return;
    }

    // Verify it's the player's turn
    const currentPlayer = gameState.activePlayers[gameState.currentTurn];
    const player = room.players.find((p) => p.socketId === client.id);

    if (!player || player.color !== currentPlayer) {
      client.emit('game-error', {
        message: 'Not your turn',
      });
      return;
    }

    // Roll the dice
    const diceValue = this.gameLogicService.rollDice();

    // Calculate movable pieces
    const movablePieces = this.gameLogicService.calculateMovablePieces(
      currentPlayer,
      diceValue,
      gameState.pieces,
    );

    // Update game state
    this.gameStateService.updateGameState(roomId, {
      diceValue,
      movablePieces,
    });

    const updatedState = this.gameStateService.getGameState(roomId);

    // Broadcast to all players in the room
    this.server.to(roomId).emit('dice-rolled', {
      diceValue,
      movablePieces,
      currentPlayer,
      gameState: updatedState,
      rolledBy: client.id,
    });

    // If no movable pieces, automatically pass turn
    if (movablePieces.length === 0) {
      setTimeout(() => {
        const nextState = this.gameStateService.nextTurn(roomId);
        this.server.to(roomId).emit('turn-passed', {
          gameState: nextState,
          message: 'No movable pieces, turn passed',
        });
      }, 1500);
    }
  }

  @SubscribeMessage('move-piece')
  handleMovePiece(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; pieceId: string; socketId: string },
  ): void {
    const roomId = this.playerRooms.get(client.id);

    if (!roomId || roomId !== data.roomId) {
      client.emit('game-error', {
        message: 'You are not in this room',
      });
      return;
    }

    const gameState = this.gameStateService.getGameState(roomId);
    if (!gameState) {
      client.emit('game-error', {
        message: 'Game not started',
      });
      return;
    }

    const currentPlayer = gameState.activePlayers[gameState.currentTurn];

    // Validate the move
    if (
      !this.gameLogicService.validateMove(
        data.pieceId,
        currentPlayer,
        gameState.movablePieces,
      )
    ) {
      client.emit('game-error', {
        message: 'Invalid move',
      });
      return;
    }

    // Execute the move
    const oldPos = gameState.pieces[data.pieceId];
    const moveResult = this.gameLogicService.movePiece(
      data.pieceId,
      gameState.diceValue,
      gameState.pieces,
    );

    // Update piece position
    this.gameStateService.updatePiecePosition(
      roomId,
      data.pieceId,
      moveResult.newPosition,
    );

    // Check for collisions
    const collisionResult = this.gameLogicService.checkCollision(
      data.pieceId,
      currentPlayer,
      gameState.pieces,
      gameState.activePlayers,
    );

    // If killed opponent piece, send it home
    if (collisionResult.killedPieceId) {
      this.gameStateService.updatePiecePosition(
        roomId,
        collisionResult.killedPieceId,
        -1,
      );
    }

    // Check for win
    const hasWon = this.gameLogicService.checkWin(
      currentPlayer,
      gameState.pieces,
    );
    if (hasWon) {
      this.gameStateService.setWinner(roomId, currentPlayer);
    }

    const updatedState = this.gameStateService.getGameState(roomId);

    // Broadcast move to all players
    this.server.to(roomId).emit('piece-moved', {
      pieceId: data.pieceId,
      oldPosition: oldPos,
      newPosition: moveResult.newPosition,
      steps: moveResult.steps,
      killedPieceId: collisionResult.killedPieceId,
      gameState: updatedState,
      movedBy: client.id,
    });

    // Handle turn change
    const gotSix = gameState.diceValue === 6;
    const killedSomeone = collisionResult.killedSomeone;

    if (!gotSix && !killedSomeone && !hasWon) {
      // Pass turn to next player
      setTimeout(() => {
        const nextState = this.gameStateService.nextTurn(roomId);
        this.server.to(roomId).emit('turn-changed', {
          gameState: nextState,
        });
      }, 1000);
    } else {
      // Reset for next roll (same player)
      this.gameStateService.updateGameState(roomId, {
        diceValue: 0,
        movablePieces: [],
      });

      const resetState = this.gameStateService.getGameState(roomId);
      this.server.to(roomId).emit('turn-reset', {
        gameState: resetState,
      });
    }

    // If game won, broadcast winner
    if (hasWon) {
      this.server.to(roomId).emit('game-won', {
        winner: currentPlayer,
        gameState: updatedState,
      });
    }
  }

  @SubscribeMessage('get-game-state')
  handleGetGameState(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ): void {
    const gameState = this.gameStateService.getGameState(data.roomId);

    if (!gameState) {
      client.emit('game-error', {
        message: 'Game state not found',
      });
      return;
    }

    client.emit('game-state-response', {
      gameState,
    });
  }

  private generateRoomId(): string {
    return `ROOM_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}
