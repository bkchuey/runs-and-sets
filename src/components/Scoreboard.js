import React, { useState, useEffect } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'
import { updateScoreboard } from './firebaseUtils'

const Scoreboard = props => {
    const [open, setOpen] = useState(false)
    const [scoreboard, setScoreboard] = useState([])

    const getUpdatedScoreboard = async (boardId) => {
        setScoreboard(await updateScoreboard(boardId))
    }

    const handleClose = () => {
        setOpen(false)
        props.closeScoreboard(true)
    }

    useEffect(() => {
        props.isGameOver && getUpdatedScoreboard(props.boardId)
    }, [props.isGameOver])

    useEffect(() => {
        getUpdatedScoreboard(props.boardId)
    }, [])

    useEffect(() => {
        setOpen(props.isScoreboardOpen)
    }, [props.isScoreboardOpen])

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle align="center">Scoreboard</DialogTitle>
            <DialogContent>
                {scoreboard && scoreboard.map((item, index) => (
                    <div key={index}>
                        <Typography>{item.name}</Typography>
                        <Typography>{item.points}</Typography>
                    </div>
                ))}
            </DialogContent>
        </Dialog>
    )
}

export default Scoreboard
