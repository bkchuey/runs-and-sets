import React, { useState, useEffect } from 'react'
import { Container } from 'react-smooth-dnd'
import NondraggableCard from './NondraggableCard'
import { applyDragSet, applyDragRun } from './utils'
import { doc, arrayRemove, writeBatch } from "firebase/firestore";
import { database } from './firebaseUtils'

const CardsInPlayContainer = props => {
    const [items, setItems] = useState(props.items)
    const [isValid, setIsValid] = useState(false)
    const [isSet, setIsSet] = useState(false)
    const [isRun, setIsRun] = useState(false)
    const [fieldName] = useState(props.fieldName)
    const [boardId] = useState(props.boardId)

    const handleOnDropReady = e => {
        if (isRun && checkValidForRun(e.payload)) setIsValid(true)
        if (isSet && checkValidForSet(e.payload)) setIsValid(true)
    }

    const checkSetOrRun = () => {
        if (items[0].value === items[items.length - 1].value) setIsSet(true)
        else setIsRun(true)
    }

    const checkValidForSet = payload => {
        if (payload.value !== items[0].value) return false

        items.forEach(el => {
            if (Object.values(el).includes(payload.suit)) {
                return false
            }
        })
        return true
    }

    const checkValidForRun = payload => {
        return (payload.suit === items[0].suit && (payload.value === items[0].value + 1 || payload.value === items[items.length - 1].value - 1))
    }

    const handleOnDrop = e => {
        if ((checkValidForRun(e.payload) || checkValidForSet(e.payload)) && e.addedIndex !== null) {
            const playerId = e.payload.playerId
            delete e.payload.playerId
            let result

            if (isSet) {
                result = applyDragSet(items, e)
            } else if (isRun && e.payload.value === items[0].value + 1) {
                result = applyDragRun(items, e, 0)
            } else if (isRun && e.payload.value === items[items.length - 1].value - 1) {
                result = applyDragRun(items, e, items.length)
            }
            batchedWrites(result, e.payload, playerId)
        }
        setIsValid(false)
    }

    const batchedWrites = async (result, payload, playerId) => {
        const batch = writeBatch(database)

        batch.update(doc(database, "cardsInPlayContainer", boardId), {
            [fieldName]: result
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
                hand: arrayRemove(payload)
            })
        }

        await batch.commit()
    }

    const handleShouldAcceptDrop = e => {
        return e.acceptDrop.isPlayerTurn && (e.acceptDrop.hasPlayedSetOrRun || props.isContainer0Valid)
    }

    useEffect(() => {
        items && checkSetOrRun()
    }, [items])

    useEffect(() => {
        setItems(props.items)
    }, [props.items])

    const divStyle = {
        // height: items.length * 50 + 50
        paddingBottom: '20px'
    }

    const containerStyle = {
        width: '150px',
        // height: '165px',
        padding: '10px',
        backgroundColor: isValid ? '#2ecc71' : '#c0392b',
        borderRadius: '10px',
    }

    return (
        <div style={divStyle}>
            <Container groupName="1" getChildPayload={i => items[i]} 
                onDrop={handleOnDrop} 
                dropPlaceholder={{showOnTop: true}}
                style={containerStyle}
                onDropReady={handleOnDropReady}
                onDragLeave={() => setIsValid(false)}
                shouldAcceptDrop={handleShouldAcceptDrop}
            >
                {items && items.map(item => <NondraggableCard key={item.id} item={item} />)}
            </Container>
        </div>
    )
}

export default CardsInPlayContainer