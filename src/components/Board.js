import { Grid, Container as MuiContainer, Button } from '@mui/material'
import React, { useState, useEffect } from 'react'
import Hand from './Player'
import Discard from './Discard'
import CardContainerGrid from './CardContainerGrid'
import CardsInPlayContainerGrid from './CardsInPlayContainerGrid'
import { deleteGame, database, resetBoardState, dealStartingHands } from './firebaseUtils'
import { doc, onSnapshot } from '@firebase/firestore'
import GameOverDialog from './GameOverDialog'
import Scoreboard from './Scoreboard'

const Board = props => {
    const [boardId] = useState(props.boardId)
    const [playerId] = useState(props.playerId)
    const [allPlayerIds] = useState(props.allPlayerIds)
    const [currentPlayer, setCurrentPlayer] = useState()
    const [isAllContainersValid, setIsAllContainersValid] = useState()
    const [isContainer0Valid, setIsContainer0Valid] = useState(false)
    const [hasDealtStartingHands, setHasDealtStartingHands] = useState(false)
    const [isGameOver, setIsGameOver] = useState(false)
    const [isScoreboardOpen, setIsScoreboardOpen] = useState(false)

    // const handleDeleteGamePress = async () => {
    //     await deleteGame()
    // }

    // const handleResetBoardPress = async () => {
    //     await resetBoardState()
    // }

    const handleAreAllContainersValid = e => {
        setIsAllContainersValid(e)
    }

    const handleIsContainer0Valid = e => {
        setIsContainer0Valid(e)
    }

    const handleDealStartingHands = async () => {
        if (!hasDealtStartingHands) {
            dealStartingHands([allPlayerIds])
        }
    }

    const handleScoreboardOpen = () => {
        setIsScoreboardOpen(prevState => !prevState)
    }

    const newBoard = async () => {
        handleDealStartingHands()
    }

    useEffect(() => {
        newBoard()
    }, [])

    useEffect(() => {
        const unsub = onSnapshot(doc(database, "board", props.boardId),
            doc => {
                setHasDealtStartingHands(doc.data().hasDealtStartingHands)
                setCurrentPlayer(doc.data().currentPlayer)
                setIsGameOver(doc.data().isGameOver)
            }
        )

        return (
            () => unsub()
        )
    }, [])

    return (
        <div>
            <MuiContainer style={{marginTop: '20px'}}>
                <CardsInPlayContainerGrid boardId={boardId} isContainer0Valid={isContainer0Valid} />
                <CardContainerGrid boardId={boardId} currentPlayer={currentPlayer} playerId={playerId} areAllContainersValid={handleAreAllContainersValid} isContainer0Valid={handleIsContainer0Valid} />
            </MuiContainer>
            <div style={{position: 'fixed', right: 10, bottom: 0}}>
                <Grid container direction="column">
                    {/* <Button variant="contained" onClick={handleResetBoardPress} color="error">Reset Board</Button>
                    <Button variant="contained" onClick={handleDeleteGamePress} color="error">DELETE GAME</Button> */}
                    <Button variant="contained" onClick={handleScoreboardOpen} >Scoreboard</Button>
                    <Discard boardId={boardId} />
                </Grid>
            </div>
            <MuiContainer>
                <MuiContainer style={{position: 'fixed', bottom: 10}}>
                    <Hand playerId={playerId} boardId={boardId} currentPlayer={currentPlayer} isAllContainersValid={isAllContainersValid}/>
                </MuiContainer>
            </MuiContainer>
            {isGameOver && <GameOverDialog isGameOver={isGameOver} boardId={boardId}/>}
            <Scoreboard isGameOver={isGameOver} boardId={boardId} playerId={playerId} isScoreboardOpen={isScoreboardOpen} closeScoreboard={handleScoreboardOpen}/>
        </div>
    )
}

export default Board