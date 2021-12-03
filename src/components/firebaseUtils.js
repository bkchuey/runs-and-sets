import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
// import { getAnalytics } from "firebase/analytics";
import { collection, query, doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch, runTransaction, increment } from "firebase/firestore";
import { createDeck, shuffleDeck } from "./utils";
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';

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

const playerNameConfig = {
    dictionaries: [adjectives, colors, animals],
    style: 'capital',
    separator: ' '
}
const roomCodeConfig = {
    dictionaries: [adjectives, colors, animals],
    separator: '-'
}

let boardId, boardRef, deckRef, discardRef, cardContainerRef, cardsInPlayContainerRef

//-----------------
// Initialize components in database
//-----------------

const initializeDocRefs = (board) => {
    boardId = board
    boardRef = doc(database, "board", board)
    deckRef = doc(database, "deck", board)
    discardRef = doc(database, "discard", board)
    cardContainerRef = doc(database, "cardContainer", board)
    cardsInPlayContainerRef = doc(database, "cardsInPlayContainer", board)
}

export const initializeNewBoard = async (boardId, [players]) => {
    await initializeBoard(boardId, [players])
    await initializeCardContainer()
    await initializeCardsInPlayContainer()
    await initializeDeck()
    await initializeDiscard()
}

const initializeBoard = async (boardId, [players]) => {
    initializeDocRefs(boardId)
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

const initializeDeck = async () => {
    const docSnap = await getDoc(deckRef)

    if (!docSnap.exists()) {
        await setDoc(deckRef, {
            boardId: boardId,
            deck: createDeck(),
        })
    }
    return true
}

const initializeDiscard = async () => {
    const docSnap = await getDoc(discardRef)

    if (!docSnap.exists()) {
        await setDoc(discardRef, {
            boardId: boardId,
            discard: [],
        })
    }
    return true
}

const initializeCardContainer = async () => {
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

const initializeCardsInPlayContainer = async () => {
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
            points: 0,
            name: uniqueNamesGenerator(playerNameConfig),
            boardId: null,
        })
        return null
    }
    return docSnap.data().boardId
}

export const resetBoardState = async () => {
    const boardSnap = await getDoc(boardRef)
    const currentPlayer = boardSnap.data().players[(boardSnap.data().roundNumber + 1) % boardSnap.data().players.length]

    const players = boardSnap.data().players

    const batch = writeBatch(database)

    batch.update(cardContainerRef, {
        0: [],
        1: [],
        2: [],
        containers: [],
    })
    batch.set(cardsInPlayContainerRef, {
        boardId: boardId,
    })
    batch.update(deckRef, {
        deck: createDeck(),
    })
    batch.update(discardRef, {
        discard: [],
    })
    batch.update(boardRef, {
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
    await dealStartingHands([players])
}

export const dealStartingHands = async ([players]) => {
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

            transaction.update(discardRef, {
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
    let roomCode = uniqueNamesGenerator(roomCodeConfig)
    
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
    const boardSnap = await getDoc(boardRef)

    const batch = writeBatch(database)

    boardSnap.data().players.forEach(el => {
        batch.update(doc(database, "player", el), {
            boardId: boardId,
        })
    })
    batch.commit()
}

const unassignPlayerToGameRoom = async () => {
    const boardSnap = await getDoc(boardRef)

    const batch = writeBatch(database)

    boardSnap.data().players.forEach(el => {
        batch.update(doc(database, "player", el), {
            boardId: null,
            points: 0,
            hasDrawn: false,
            hasDiscarded: false,
            hasPlayedSetOrRun: false,
        })
    })
    batch.commit()
}

export const deleteGame = async () => {
    unassignPlayerToGameRoom()

    const batch = writeBatch(database)

    batch.delete(deckRef)
    batch.delete(discardRef)
    batch.delete(cardContainerRef)
    batch.delete(cardsInPlayContainerRef)
    batch.delete(boardRef)
    batch.delete(doc(database, "game", boardId))
    batch.delete(doc(database, "room", boardId))

    batch.commit()
}

//-----------------
// In-game actions
//-----------------

export const drawFromDeck = async (playerId, items) => {
    await runTransaction(database, async (transaction) => {
        const deckSnap = await transaction.get(deckRef)
        let cardToDraw

        if (deckSnap.data().deck.length === 0) {
            const discardSnap = await transaction.get(discardRef)

            let deck = discardSnap.data().discard.slice(0, discardSnap.data().discard.length - 1)
            let discard = discardSnap.data().discard[discardSnap.data().discard.length - 1]

            transaction.update(deckRef, {
                deck: shuffleDeck(deck),
            })
            transaction.update(discardRef, {
                discard: [discard]
            })

            cardToDraw = deck[0]
        } else {
            cardToDraw = deckSnap.data().deck[0]
        }

        transaction.update(doc(database, "player", playerId), {
            hand: [...items, cardToDraw],
            hasDrawn: true,
        })
        transaction.update(deckRef, {
            deck: arrayRemove(cardToDraw)
        })
    })
}

export const drawFromDiscard = async (playerId, items) => {
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

export const endTurn = async (playerId, items) => {
    const playerRef = doc(database, "player", playerId)

    await updateDoc(playerRef, {
        hand: items,
    })

    moveCardsToInPlayContainer(playerId, items.length)
}

const moveCardsToInPlayContainer = async (playerId, handSize) => {
    const docSnap = await getDoc(cardContainerRef)
    let temp = {}

    const cardsInPlayContainerSnap = await getDoc(cardsInPlayContainerRef)
    let count = Object.keys(cardsInPlayContainerSnap.data()).length - 1

    for (let i = 0; i < 3; i++) {
        if (docSnap.data()[i].length > 2) {
            await updateHasPlayedSetOrRun(playerId)
            temp[count + i] = docSnap.data()[i]
        }
    }
    await updateDoc(cardsInPlayContainerRef, temp)
    await clearContainers()
    if (handSize === 0) {
        await boardOver()
    }
    else await nextTurn()
}

const clearContainers = async () => {
    await updateDoc(cardContainerRef, {
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

const nextTurn = async () => {
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

const boardOver = async () => {
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

export const updateScoreboard = async () => {
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