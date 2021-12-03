import React, { useState, useEffect } from 'react'
import { Button, Dialog, DialogContent, DialogTitle, Grid } from '@mui/material'
import { drawFromDeck, drawFromDiscard } from './firebaseUtils'

const NewTurnDialog = props => {
    const [open, setOpen] = useState(false)
    const [playerId] = useState(props.playerId)

    const handleDrawFromDeck = async () => {
        await drawFromDeck(playerId, props.items)
        handleClose()
    }
    
    const handleDrawFromDiscard = async () => {
        await drawFromDiscard(playerId, props.items)
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
