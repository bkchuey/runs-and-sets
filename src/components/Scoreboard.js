import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle, Grid, Typography } from '@mui/material'
import { updateScoreboard } from './firebaseUtils'

const Scoreboard = props => {
    const [open, setOpen] = useState(false)
    const [scoreboard, setScoreboard] = useState([])

    const getUpdatedScoreboard = async () => {
        setScoreboard(await updateScoreboard())
    }

    const handleClose = () => {
        setOpen(false)
        props.closeScoreboard(true)
    }

    useEffect(() => {
        props.isGameOver && getUpdatedScoreboard()
    }, [props.isGameOver])

    useEffect(() => {
        getUpdatedScoreboard()
    }, [])

    useEffect(() => {
        setOpen(props.isScoreboardOpen)
    }, [props.isScoreboardOpen])

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle align="center">Scoreboard</DialogTitle>
            <DialogContent>
                <Grid container align="center" spacing={2}>
                    {scoreboard && scoreboard.map((item, index) => (
                        <Grid item xs={12} key={index}>
                            <Typography variant="h6">{item.name} {item.player === props.playerId ? "(You)" : ""}</Typography>
                            <Typography variant="subtitle">Points: {item.points}</Typography>
                        </Grid>
                    ))}
                </Grid>
            </DialogContent>
        </Dialog>
    )
}

export default Scoreboard
