import Game from "./models/Game.js";
import { PLAYER_LIMIT, BOARD_WIDTH } from "./Constants.js";
import Player from "./models/Player.js";

let games = {};

export function joinGame({ playerId, nickname }) {
  const player = Player({ playerId, nickname });

  let game = getAvailableGame();
  game = {
    ...game,
    players: {
      ...game.players,
      [player.playerId]: player,
    },
    status: game.status + 1,
  };

  const playerIds = Object.keys(game.players);

  if (game.status === PLAYER_LIMIT) {
    const actionAndTurns = getActions(playerIds);

    for (let id in game.players) {
      const player = game.players[id];
      game = {
        ...game,
        players: {
          ...game.players,
          [id]: { ...player, ...actionAndTurns[id] },
        },
      };
    }
  }
  leaveGame(playerId);

  updateGames(game);

  return game;
}

function leaveGame(playerId) {
  for (let gameId in games) {
    let game = games[gameId];
    if (playerId in game.players && game.isFinished) {
      const { [playerId]: _, ...rest } = game.players;
      game = { ...game, players: rest };
      updateGames(game);
      break;
    }
  }
}

export function resignGame({ playerId, gameId }) {
  let game = games[gameId];
  const { [playerId]: _, ...winner } = game.players;
  return { ...game, isFinished: true, wonBy: Object.keys(winner)[0] };
}

export function playGame({ cellId, gameId, playerId }) {
  let game = games[gameId];
  //update board
  const i = Math.floor(cellId / BOARD_WIDTH);
  const j = cellId % BOARD_WIDTH;
  const { action } = game.players[playerId];
  game.board[i][j].player = { playerId, action };
  //is game finished
  const { isFinished, wonBy, wConditions, winnerCells } = isFinish(
    game.board,
    game.winConditions
  );
  if (isFinished) {
    const players = wonBy
      ? {
          ...game.players,
          [wonBy]: {
            ...game.players[wonBy],
            wins: game.players[wonBy].wins + 1,
          },
        }
      : game.players;

    game = {
      ...game,
      isFinished,
      wonBy,
      winnerCells,
      count: game.count + 1,
      players,
    };
    updateGames(game);
    return game;
  }
  game = { ...game, winConditions: wConditions };
  //update turn
  Object.keys(game.players).forEach((pId) => {
    const player = game.players[pId];
    game = {
      ...game,
      players: {
        ...game.players,
        [pId]: { ...player, isTurn: !player.isTurn },
      },
    };
  });
  //update games state
  updateGames(game);
  return game;
}

function getActions(players) {
  const actions = ["x", "o"];
  const isTurns = [true, false];
  const rAction = Math.floor(Math.random() * actions.length);
  const rTurn = Math.floor(Math.random() * isTurns.length);

  return {
    [players[0]]: { action: actions[rAction], isTurn: isTurns[rTurn] },
    [players[1]]: {
      action: actions[actions.length - 1 - rAction],
      isTurn: isTurns[isTurns.length - 1 - rTurn],
    },
  };
}

function getAvailableGame() {
  for (let gameId of Object.keys(games)) {
    const game = games[gameId];
    if (Object.keys(game.players).length < PLAYER_LIMIT && !game.isFinished) {
      return game;
    }
  }
  return Game({});
}

function isFinish(board, winConditions) {
  const wConditions = Array.from(winConditions);
  for (let i = 0; i < winConditions.length; i++) {
    const [c1, c2, c3] = winConditions[i];
    const cell1 = board[Math.floor(c1 / BOARD_WIDTH)][c1 % BOARD_WIDTH].player;
    const cell2 = board[Math.floor(c2 / BOARD_WIDTH)][c2 % BOARD_WIDTH].player;
    const cell3 = board[Math.floor(c3 / BOARD_WIDTH)][c3 % BOARD_WIDTH].player;

    // same player on each condition => player won
    if (
      cell1 &&
      cell2 &&
      cell3 &&
      cell1.playerId === cell2.playerId &&
      cell2.playerId === cell3.playerId
    )
      return {
        wConditions,
        isFinished: true,
        wonBy: cell1.playerId,
        winnerCells: [c1, c2, c3],
      };

    //different players on each condition => remove the condition
    if (
      (cell1 && cell2 && cell1.playerId !== cell2.playerId) ||
      (cell1 && cell3 && cell1.playerId !== cell3.playerId) ||
      (cell2 && cell3 && cell2.playerId !== cell3.playerId)
    )
      wConditions.splice(i, 1);
  }
  if (wConditions.length === 0)
    return { wConditions, isFinished: true, wonBy: null, winnerCells: null };
  return { wConditions, isFinished: false, wonBy: null, winnerCells: null };
}

export function getGameById(gameId) {
  return games[gameId];
}

export function rematch(gameId, playerId) {
  let game = games[gameId];
  game = {
    ...game,
    players: {
      ...game.players,
      [playerId]: { ...game.players[playerId], rematchRequest: true },
    },
  };

  const status = Object.keys(game.players).reduce(
    (current, pId) => game.players[pId].rematchRequest + current,
    0
  );

  game = { ...game, status };
  updateGames(game);
  return game;
}

function updateGames(game) {
  games = { ...games, [game.id]: game };
}

export function resetGame(gameId) {
  let game = games[gameId];

  const actionAndTurns = getActions(Object.keys(game.players));

  let players = game.players;
  for (let id in game.players) {
    const player = Player({ ...game.players[id] });
    players = {
      ...players,
      [id]: { ...player, ...actionAndTurns[id] },
    };
  }

  const newGame = Game({ id: game.id, players, count: game.count });
  updateGames(newGame);
  return newGame;
}
