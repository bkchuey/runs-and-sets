import React, { useState, useEffect } from 'react'
import Board from './Board'
import { doc, onSnapshot } from '@firebase/firestore'
import { database, initializeNewBoard } from './firebaseUtils'

const Game = props => {
    const [playerId] = useState(props.playerId)
    const [roomCode] = useState(props.match.params.roomCode)
    const [allPlayerIds, setAllPlayerIds] = useState()
    const [isBoardReady, setIsBoardReady] = useState(false)

    const newBoard = async (roomCode, players) => {
        await initializeNewBoard(roomCode, [players])
        setIsBoardReady(true)
    }

    useEffect(() => {
        const unsub = onSnapshot(doc(database, "game", props.match.params.roomCode), doc => {
            setAllPlayerIds(doc.data().players)
            newBoard(props.match.params.roomCode, doc.data().players)
        })

        return () => {
            unsub()
        }
    }, [])


    return (
        <div>
            {playerId && allPlayerIds && roomCode && isBoardReady && 
            <Board playerId={playerId} allPlayerIds={allPlayerIds} boardId={roomCode} />}
        </div>
    )
}

export default Game
