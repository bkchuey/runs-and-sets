import React, { useState, useEffect } from 'react'
import { Container } from 'react-smooth-dnd'
import { doc, writeBatch, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { database } from './firebaseUtils'
import NondraggableCard from './NondraggableCard';

const Discard = props => {
    const [items, setItems] = useState([])
    const [boardId] = useState(props.boardId)

    const handleOnDrop = e => {
        if (e.addedIndex !== null) {
            batchedWrites(e.payload)
        }
    }

    const batchedWrites = async (payload) => {
        const batch = writeBatch(database)
        const playerId = payload.playerId
        delete payload.playerId

        batch.update(doc(database, "discard", boardId), {
            discard: arrayUnion(payload)
        })
        if (!playerId) {
            batch.update(doc(database, "cardContainer", boardId), {
                0: arrayRemove(payload),
                1: arrayRemove(payload),
                2: arrayRemove(payload),
            })
        }
        if (playerId) {
            batch.update(doc(database, "player", playerId), {
                hand: arrayRemove(payload),
                hasDiscarded: true,
            })
        }
        await batch.commit()
    }

    // const handlePayload = i => {
    //     if (i !== null) {
    //         console.log(i)
    //         let card = items[items.length-1]
    //         // removeFromDiscard(card)
    //         return card
    //     }
    //     // return cardsInDiscard[cardsInDiscard.length-1]
    // }

    const handleShouldAcceptDrop = e => {
        return e.acceptDrop.isPlayerTurn && !e.acceptDrop.hasDiscarded && e.acceptDrop.hasDrawn
    }

    const style ={
        // width: '165px',
        height: '180px',
        backgroundColor: 'grey',
        // float:'right',
        // marginRight: '30px',
        padding: '10px'
    }

    useEffect(() => {
        const unsub = onSnapshot(doc(database, "discard", props.boardId),
            // {includeMetadataChanges: true},
            doc => {
                setItems(doc.data().discard)
            }
        )

        return (
            () => unsub()
        )
    }, [])

    return (
        <div style={style}>
            <Container dropPlaceholder={{showOnTop: true}} 
                // getChildPayload={i => handlePayload(i)}
                onDrop={e => handleOnDrop(e)}
                // style={style}
                shouldAcceptDrop={handleShouldAcceptDrop}
                >
                {items.length > 0 && <NondraggableCard key={items.at(-1).id} id={items.at(-1).id} item={items.at(-1)} isFullCard={true} />}
            </Container>
        </div>
    )

}

export default Discard