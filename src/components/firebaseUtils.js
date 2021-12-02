import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// import { getAnalytics } from "firebase/analytics";
import { collection, query, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, writeBatch, runTransaction, increment } from "firebase/firestore";
import { createDeck } from "./utils";

const firebaseConfig = {
    apiKey: "AIzaSyCQ-Vcz8YYWSePuFMpD1QOc7CoBaZs-Flg",
    authDomain: "runs-and-sets.firebaseapp.com",
    projectId: "runs-and-sets",
    storageBucket: "runs-and-sets.appspot.com",
    messagingSenderId: "287873630094",
    appId: "1:287873630094:web:1131c7f8c65fa6d539eedf",
    measurementId: "G-TPZ5ZQRGCL"
};

const app = initializeApp(firebaseConfig);
export const database = getFirestore(app)
// const analytics = getAnalytics(app);


//-----------------
// Initialize components in database
//-----------------

export const initializeBoard = async (boardId, [players]) => {
    // console.log([players])
    const boardRef = doc(database, "board", boardId)
    const docSnap = await getDoc(boardRef)

    if (!docSnap.exists()) {
        await setDoc(boardRef, {
            boardId: boardId,
            turnNumber: 0,
            hasDealtStartingHands: false,
            roundNumber: 0,
            players: players,
            currentPlayer: players[0],
        })
    }
    assignPlayerToGameRoom(boardId)
}

export const initializeDeck = async (boardId) => {
    const deckRef = doc(database, "deck", boardId)
    const docSnap = await getDoc(deckRef)

    if (!docSnap.exists()) {
        await setDoc(deckRef, {
            boardId: boardId,
            deck: createDeck(),
        })
    }
    return true
}

export const initializeDiscard = async (boardId) => {
    const discardRef = doc(database, "discard", boardId)
    const docSnap = await getDoc(discardRef)

    if (!docSnap.exists()) {
        await setDoc(discardRef, {
            boardId: boardId,
            discard: [],
        })
    }
    return true
}

export const initializeCardContainer = async (boardId) => {
    const cardContainerRef = doc(database, "cardContainer", boardId)
    const docSnap = await getDoc(cardContainerRef)

    if (!docSnap.exists()) {
        await setDoc(cardContainerRef, {
            boardId: boardId,
            containers: [],
            0: [],
            1: [],
            2: [],
        })
    }
    return true
}

export const initializeCardsInPlayContainer = async (boardId) => {
    const cardsInPlayContainerRef = doc(database, "cardsInPlayContainer", boardId)
    const docSnap = await getDoc(cardsInPlayContainerRef)

    if (!docSnap.exists()) {
        await setDoc(cardsInPlayContainerRef, {
            boardId: boardId,
        })
    }
    return true
}

export const initializePlayer = async (uid) => {
    const playerRef = doc(database, "player", uid)
    const docSnap = await getDoc(playerRef)

    if (!docSnap.exists()) {
        await setDoc(playerRef, {
            hand: [],
            hasDiscarded: false,
            hasDrawn: false,
            hasPlayedSetOrRun: false,
            isPlayerTurn: false,
            hasDrawnStartingHand: false,
            points: 0,
            name: 'Anonymous',
            boardId: null,
        })
        return null
    }
    return docSnap.data().boardId
}

export const resetBoardState = async (boardId) => {
    const boardSnap = await getDoc(doc(database, "board", boardId))
    const currentPlayer = boardSnap.data().players[(boardSnap.data().roundNumber + 1) % boardSnap.data().players.length]

    const players = boardSnap.data().players
    // console.log(players)
    const batch = writeBatch(database)

    batch.update(doc(database, "cardContainer", boardId), {
        0: [],
        1: [],
        2: [],
        containers: [],
    })
    batch.set(doc(database, "cardsInPlayContainer", boardId), {
        boardId: boardId,
    })
    batch.update(doc(database, "deck", boardId), {
        deck: createDeck(),
    })
    batch.update(doc(database, "discard", boardId), {
        discard: [],
    })
    batch.update(doc(database, "board", boardId), {
        hasDealtStartingHands: false,
        roundNumber: increment(1),
        turnNumber: 0,
        currentPlayer: currentPlayer,
        isGameOver: false,
    })
    
    players.forEach(el => {
        batch.update(doc(database, "player", el), {
            hand: [],
            hasDiscarded: false,
            hasDrawn: false,
            hasPlayedSetOrRun: false,
            hasDrawnStartingHand: false,
        })
    })

    await batch.commit()
    await dealStartingHands([players], boardId)
}

export const dealStartingHands = async ([players], boardId) => {
    const deckRef = doc(database, "deck", boardId)
    const boardRef = doc(database, "board", boardId)

    await runTransaction(database, async(transaction) => {
        const boardSnap = await transaction.get(boardRef)

        if (!boardSnap.data().hasDealtStartingHands) {
            const deckSnap = await transaction.get(deckRef)
            const cardsInDeck = deckSnap.data().deck

            let start = 0, end = 10

            players.forEach(el => {
                transaction.update(doc(database, "player", el), {
                    hand: cardsInDeck.slice(start, end)
                })
                start += 10
                end += 10
            })

            transaction.update(doc(database, "discard", boardId), {
                discard: [cardsInDeck[start]],
            })

            transaction.update(deckRef, {
                deck: cardsInDeck.slice(start+1)
            })

            transaction.update(boardRef, {
                hasDealtStartingHands: true,
            })
        }
    })
}

//-----------------
// Room
//-----------------

export const createRoom = async () => {
    let roomCode = require('human-readable-ids').hri.random()
    
    await setDoc(doc(database, "room", roomCode), {
        isGameStarted: false,
        roomCode: roomCode,
        players: [],
    })
    return roomCode
}

export const getRoomCodes = async () => {
    const roomRef = collection(database, "room")
    const q = query(roomRef)
    const querySnapshot = await getDocs(q)

    let temp = []

    if (!querySnapshot.empty) {
        querySnapshot.forEach(el => {
            temp.push(el.data().roomCode)
        })
    }
    return temp
}

export const addPlayerToRoom = async (roomCode, playerId) => {
    const roomRef = doc(database, "room", roomCode)

    await updateDoc(roomRef, {
        players: arrayUnion(playerId)
    })
}

export const removePlayerFromRoom = async (roomCode, playerId) => {
    const roomRef = doc(database, "room", roomCode)

    await updateDoc(roomRef, {
        players: arrayRemove(playerId)
    })
}

export const setStartGameInRoom = async (roomCode) => {
    const roomRef = doc(database, "room", roomCode)

    await updateDoc(roomRef, {
        isGameStarted: true
    })
}

//-----------------
// Game
//-----------------

export const getGameCodes = async () => {
    const gameRef = collection(database, "game")
    const q = query(gameRef)
    const querySnapshot = await getDocs(q)

    let temp = []

    if (!querySnapshot.empty) {
        querySnapshot.forEach(el => {
            temp.push(el.data().roomCode)
        })
    }
    return temp
}

export const initializeGame = async (roomCode, [players]) => {
    const gameRef = doc(database, "game", roomCode)
    const docSnap = await getDoc(gameRef)

    if (!docSnap.exists()) {
        await setDoc(gameRef, {
            roomCode: roomCode,
            isGameStarted: true,
            isGameOver: false,
            players: players,
        })
    }
}

const assignPlayerToGameRoom = async (boardId) => {
    const boardRef = doc(database, "board", boardId)
    const boardSnap = await getDoc(boardRef)

    const batch = writeBatch(database)

    boardSnap.data().players.forEach(el => {
        batch.update(doc(database, "player", el), {
            boardId: boardId,
            // points: 0,
        })
    })

    batch.commit()
}

const unassignPlayerToGameRoom = async (boardId) => {
    const boardRef = doc(database, "board", boardId)
    const boardSnap = await getDoc(boardRef)

    const batch = writeBatch(database)

    boardSnap.data().players.forEach(el => {
        batch.update(doc(database, "player", el), {
            boardId: null,
            points: 0,
        })
    })

    batch.commit()
}

export const deleteGame = async (boardId) => {
    unassignPlayerToGameRoom(boardId)
    await deleteDoc(doc(database, "deck", boardId))
    await deleteDoc(doc(database, "discard", boardId))
    await deleteDoc(doc(database, "cardContainer", boardId))
    await deleteDoc(doc(database, "cardsInPlayContainer", boardId))
    await deleteDoc(doc(database, "board", boardId))
    await deleteDoc(doc(database, "game", boardId))
    await deleteDoc(doc(database, "room", boardId))

}

export const initializeNewBoard = async (boardId, [players]) => {
    await initializeBoard(boardId, [players])
    await initializeCardContainer(boardId)
    await initializeCardsInPlayContainer(boardId)
    await initializeDeck(boardId)
    await initializeDiscard(boardId)
}

//-----------------
// In-game actions
//-----------------

export const drawFromDeck = async (boardId, playerId, items) => {
    const deckRef = doc(database, "deck", boardId)

    await runTransaction(database, async (transaction) => {
        const deckSnap = await transaction.get(deckRef)
        const cardToDraw = deckSnap.data().deck[0]

        transaction.update(doc(database, "player", playerId), {
            hand: [...items, cardToDraw],
            hasDrawn: true,
        })
        transaction.update(deckRef, {
            deck: arrayRemove(cardToDraw)
        })
    })
}

export const drawFromDiscard = async (boardId, playerId, items) => {
    const discardRef = doc(database, "discard", boardId)

    await runTransaction(database, async (transaction) => {
        const discardSnap = await transaction.get(discardRef)
        const cardToDraw = discardSnap.data().discard[discardSnap.data().discard.length-1]

        transaction.update(doc(database, "player", playerId), {
            hand: [...items, cardToDraw],
            hasDrawn: true,
        })
        transaction.update(discardRef, {
            discard: arrayRemove(cardToDraw)
        })
    })
}

export const endTurn = async (boardId, playerId, items) => {
    const playerRef = doc(database, "player", playerId)

    await updateDoc(playerRef, {
        hand: items,
    })

    moveCardsToInPlayContainer(boardId, playerId, items.length)
}

const moveCardsToInPlayContainer = async (boardId, playerId, handSize) => {
    const docSnap = await getDoc(doc(database, "cardContainer", boardId))
    let temp = {}

    const cardsInPlayContainerRef = doc(database, "cardsInPlayContainer", boardId)
    const cardsInPlayContainerSnap = await getDoc(cardsInPlayContainerRef)
    let count = Object.keys(cardsInPlayContainerSnap.data()).length - 1

    for (let i = 0; i < 3; i++) {
        if (docSnap.data()[i].length > 2) {
            await updateHasPlayedSetOrRun(playerId)
            temp[count + i] = docSnap.data()[i]
        }
    }
    await updateDoc(cardsInPlayContainerRef, temp)
    await clearContainers(boardId)
    if (handSize === 0) {
        await boardOver(boardId)
    }
    else await nextTurn(boardId)
}

const clearContainers = async (boardId) => {
    await updateDoc(doc(database, "cardContainer", boardId), {
        0: [],
        1: [],
        2: [],
        containers: []
    })
}

const updateHasPlayedSetOrRun = async (playerId) => {
    await updateDoc(doc(database, "player", playerId), {
        hasPlayedSetOrRun: true,
    })
}

const nextTurn = async (boardId) => {
    const boardRef = doc(database, "board", boardId)

    await runTransaction(database, async(transaction) => {
        const boardSnap = await transaction.get(boardRef)

        let turnNumber = boardSnap.data().turnNumber + 1

        let player = boardSnap.data().players[(turnNumber + boardSnap.data().roundNumber) % boardSnap.data().players.length]

        transaction.update(boardRef, {
            turnNumber: turnNumber,
            currentPlayer: player,
        })

        transaction.update(doc(database, "player", player), {
            hasDrawn: false,
            hasDiscarded: false,
        })
    })
}

const boardOver = async (boardId) => {
    const boardRef = doc(database, "board", boardId)

    const boardSnap = await getDoc(boardRef)
    const players = boardSnap.data().players

    for (let player of players) {
        const playerRef = doc(database, "player", player)
        const playerSnap = await getDoc(playerRef)
        let handTotal = playerSnap.data().points

        playerSnap.data().hand.forEach(card => {
            handTotal += card.value
        })

        await updateDoc(playerRef, {
            points: handTotal,
        })
    }
    
    await updateDoc(boardRef, {
        isGameOver: true,
    })
}

export const updateScoreboard = async (boardId) => {
    const boardRef = doc(database, "board", boardId)

    const boardSnap = await getDoc(boardRef)
    const players = boardSnap.data().players

    let scores = []

    for (let player of players) {
        const playerRef = doc(database, "player", player)
        const playerSnap = await getDoc(playerRef)

        let temp = {
            player: playerSnap.id,
            name: playerSnap.data().name,
            points: playerSnap.data().points,
        }

        scores.push(temp)
    }
    return scores
}