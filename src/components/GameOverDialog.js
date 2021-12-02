import React, { useState, useEffect } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, Grid } from '@mui/material'
import { deleteGame, resetBoardState } from './firebaseUtils'

const GameOverDialog = props => {
    const [open, setOpen] = useState(false)

    const handleNextRound = async () => {
        handleClose()
        await resetBoardState(props.boardId)
    }

    const handleEndGame = async () => {
        await deleteGame(props.boardId)
        handleClose()
        props.history.push('/')
    }

    const handleClose = () => {
        setOpen(false)
    }

    useEffect(() => {
        setOpen(props.isGameOver)
    }, [props.isGameOver])

    return (
        <Dialog open={open} >
            <DialogTitle align="center">Round over!</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item>
                        <Button variant="contained" onClick={handleEndGame}>End Game</Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" onClick={handleNextRound}>Next Round</Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    )
}

export default GameOverDialog
