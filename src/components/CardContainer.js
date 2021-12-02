import React, { useState, useEffect } from 'react'
import { Container } from 'react-smooth-dnd'
import DraggableCard from './DraggableCard'
import { applyDrag } from './utils'
import { doc, arrayRemove, writeBatch } from "firebase/firestore";
import { database } from './firebaseUtils'

const CardContainer = props => {
    const [items, setItems] = useState(props.items)
    const [index] = useState(props.index)
    const [boardId] = useState(props.boardId)

    const checkRun = () => {
        let value = items[0].value
        let suit = items[0].suit

        for (let i=1; i<items.length; i++) {
            if (items[i].value !== value - i || items[i].suit !== suit) {
                return false
            }
        }
        return true
    }

    const checkSet = () => {
        return items.every(item => item.value === items[0].value) &&
            [...new Set(items.map(item => item.suit))].length === items.length
    }

    const checkIsContainerValid = () => {
        return items?.length > 2 && (checkSet() || checkRun())
    }

    const handleIsValidProp = () => {
        props.isValid(checkIsContainerValid())
    }

    const handleOnDrop = e => {
        if (e.addedIndex !== null) {
            addToContainerArray(e)
        }
    }

    const addToContainerArray = async (e) => {
        const playerId = e.payload.playerId
        delete e.payload.playerId
        let result = applyDrag(items, e)

        const batch = writeBatch(database)

        batch.update(doc(database, "cardContainer", boardId), {
            0: arrayRemove(e.payload),
            1: arrayRemove(e.payload),
            2: arrayRemove(e.payload),
            [index]: result
        })

        if (playerId) {
            batch.update(doc(database, "player", playerId), {
                hand: arrayRemove(e.payload)
            })
        }

        batch.commit()
    }
    
    const handleShouldAcceptDrop = e => {
        return e.acceptDrop.isPlayerTurn
    }

    const divStyle = {
        height: '165px',
        borderRadius: '10px',
        marginBottom: '10px',
        backgroundColor: checkIsContainerValid() ? '#2ecc71' : '#c0392b',
        padding: '10px',
    }

    useEffect(() => {
        setItems(props.items)
    }, [props.items])

    useEffect(() => {
        items && handleIsValidProp()
    }, [items])

    return (
        <div style={divStyle}>
            <Container name="container" acceptDrop={{isPlayerTurn:true}} groupName="1" getChildPayload={i => items[i]} orientation="horizontal" 
                onDrop={e => handleOnDrop(e)} dropPlaceholder={{showOnTop: true}}
                style={{width: '150px', height: '200px'}}
                shouldAcceptDrop={handleShouldAcceptDrop}
            >
                {items && items.map(item => <DraggableCard key={item.id} item={item} />)}
            </Container>
        </div>
    )
}

export default CardContainer