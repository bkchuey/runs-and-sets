import React, { useState, useEffect } from 'react'
import { Grid } from '@mui/material'
import CardsInPlayContainer from './CardsInPlayContainer'
import { doc, onSnapshot } from "firebase/firestore";
import { database } from './firebaseUtils'

const CardsInPlayContainerGrid = props => {
    const [cardsInPlay, setCardsInPlay] = useState([])
    const [boardId] = useState(props.boardId)
    const [isContainer0Valid, setIsContainer0Valid] = useState(props.isContainer0Valid)

    useEffect(() => {
        setIsContainer0Valid(props.isContainer0Valid)
    }, [props.isContainer0Valid])

    useEffect(() => {
        const unsub = onSnapshot(doc(database, "cardsInPlayContainer", props.boardId), doc => {
            // console.log(Object.keys(doc.data()).length)
            let cardsInPlayLength = cardsInPlay.length
            let temp = [...cardsInPlay]

            for (let i=cardsInPlayLength; i<Object.keys(doc.data()).length-1; i++) {
                temp.push(doc.data()[i])
            }
            setCardsInPlay(temp)
        })

        return (
            () => unsub()
        )
    }, [])

    return (
        <Grid container>
            {boardId && cardsInPlay.map((item, index) => 
                <Grid item xs={2} key={index}>
                    <CardsInPlayContainer items={item} boardId={boardId} fieldName={index} isContainer0Valid={isContainer0Valid} />
                </Grid>
            )}
        </Grid>
    )
}

export default CardsInPlayContainerGrid