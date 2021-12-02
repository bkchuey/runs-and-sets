import React, { useState, useEffect } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, Grid } from '@mui/material'
import { drawFromDeck, drawFromDiscard } from './firebaseUtils'

const NewTurnDialog = props => {
    const [open, setOpen] = useState(false)
    const [playerId] = useState(props.playerId)
    const [boardId] = useState(props.boardId)

    const handleDrawFromDeck = async () => {
        await drawFromDeck(boardId, playerId, props.items)
        handleClose()
    }
    
    const handleDrawFromDiscard = async () => {
        await drawFromDiscard(boardId, playerId, props.items)
        handleClose()
    }

    const handleClose = () => {
        setOpen(false)
        props.closeDialog(true)
    }

    useEffect(() => {
        setOpen(props.isDialogOpen)
    }, [props.isDialogOpen])

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle align="center">Draw a Card</DialogTitle>
            <DialogContent>
                <Grid container>
                    <Grid item>
                        <Button variant="contained" onClick={handleDrawFromDeck}>Draw from Deck</Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" onClick={handleDrawFromDiscard}>Draw from Discard</Button>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    )
}

export default NewTurnDialog
