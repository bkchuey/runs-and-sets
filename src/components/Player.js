import { runTransaction, arrayRemove, doc, onSnapshot, writeBatch } from '@firebase/firestore'
import { Button, Snackbar } from '@mui/material'
import React, { useState, useEffect } from 'react'
import { Container } from 'react-smooth-dnd'
import { database, endTurn } from './firebaseUtils'
import DraggableCard from './DraggableCard'
import { applyDrag } from './utils'
import DrawCardDialog from './DrawCardDialog'

const Hand = props => {
    const [items, setItems] = useState([])
    const [hasDrawn, setHasDrawn] = useState(false)
    const [hasDiscarded, setHasDiscarded] = useState(false)
    const [hasPlayedSetOrRun, setHasPlayedSetOrRun] = useState(false)
    const [playerId] = useState(props.playerId)
    const [boardId] = useState(props.boardId)
    const [isPlayerTurn, setIsPlayerTurn] = useState()
    const [isAllContainersValid, setIsAllContainersValid] = useState(props.isAllContainersValid)
    const [isSnackOpen, setIsSnackOpen] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleDrawFromDeck = async () => {
        const docRef = doc(database, "deck", boardId)

        await runTransaction(database, async (transaction) => {
            const deckRef = await transaction.get(docRef)
            const cardToDraw = deckRef.data().deck[0]

            transaction.update(doc(database, "player", playerId), {
                hand: [...items, cardToDraw],
                hasDrawn: true,
            })
            transaction.update(docRef, {
                deck: arrayRemove(cardToDraw)
            })
        })
    }

    const handleDrawFromDiscard = async () => {
        const docRef = doc(database, "discard", boardId)

        await runTransaction(database, async (transaction) => {
            const discardRef = await transaction.get(docRef)
            const cardToDraw = discardRef.data().discard[discardRef.data().discard.length-1]

            transaction.update(doc(database, "player", playerId), {
                hand: [...items, cardToDraw],
                hasDrawn: true,
            })
            transaction.update(docRef, {
                discard: arrayRemove(cardToDraw)
            })
        })
    }

    const handleEndTurnPress = () => {
        if (isAllContainersValid) endTurn(boardId, playerId, items)
        else setIsSnackOpen(true)
    }

    const handlePayload = i => {
        let temp = items[i]
        temp['playerId'] = playerId
        return temp
    }

    const handleOnDrop = e => {
        if (e.addedIndex !== null) {
            if (!e.payload.playerId) addToHandArray(e)
            else justShufflingHand(e)
        }
    }

    const addToHandArray = async (e) => {
        let result = applyDrag(items, e)

        const batch = writeBatch(database)

        batch.update(doc(database, "player", playerId), {
            hand: result
        })
        batch.update(doc(database, "cardContainer", boardId), {
            0: arrayRemove(e.payload),
            1: arrayRemove(e.payload),
            2: arrayRemove(e.payload),
        })

        batch.commit()
    }

    const justShufflingHand = e => {
        delete e.payload.playerId
        setItems(applyDrag(items, e))
    }
    
    const divStyle ={
        backgroundColor: isPlayerTurn ? '#2ecc71' : '',
        padding: '15px',
        borderRadius: '10px',
        overflowX: 'auto',
        marginLeft: '-25px',
        marginRight: '25px',
    }

    useEffect(() => {
        setIsAllContainersValid(props.isAllContainersValid)
    }, [props.isAllContainersValid])

    useEffect(() => {
        setIsPlayerTurn(props.currentPlayer === playerId)
    }, [props.currentPlayer])

    useEffect(() => {
        const unsub = onSnapshot(doc(database, "player", props.playerId),
            doc => {
                setItems(doc.data().hand)
                setHasDrawn(doc.data().hasDrawn)
                setHasDiscarded(doc.data().hasDiscarded)
                setHasPlayedSetOrRun(doc.data().hasPlayedSetOrRun)
                setIsDialogOpen(!doc.data().hasDrawn)
            }
        )

        return (
            () => unsub()
        )
    }, [])

    return (
        <div>
            <Button variant="contained" color="error" onClick={handleDrawFromDeck}>Draw from deck</Button>
            <Button variant="contained" color="error" onClick={handleDrawFromDiscard}>Draw from Discard</Button>
            <Button variant="contained" color="error" onClick={handleEndTurnPress}>end turn</Button>
            {isPlayerTurn && <Button variant="contained" onClick={handleEndTurnPress} disabled={!(hasDrawn && (hasDiscarded || (items.length === 0 && isAllContainersValid)))} >End turn</Button>}
            <div style={divStyle}>
                <Container name="hand" acceptDrop={{isPlayerTurn, hasDiscarded, hasPlayedSetOrRun}} groupName="1" orientation="horizontal" getChildPayload={i => handlePayload(i)} onDrop={handleOnDrop}>
                    {items && items.map(item => <DraggableCard key={item.id} id={item.id} item={item} />)}
                </Container>
            </div>
            {playerId && boardId && <DrawCardDialog isDialogOpen={isDialogOpen && isPlayerTurn} playerId={playerId} boardId={boardId} items={items}/>}
            <Snackbar anchorOrigin={{vertical: 'top', horizontal: 'center'}} open={isSnackOpen} autoHideDuration={2000} onClose={() => setIsSnackOpen(false)} message="All containers must be green" />
        </div>
    )
}

export default Hand