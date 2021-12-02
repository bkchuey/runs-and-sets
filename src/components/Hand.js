import { Grid, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Container } from 'react-smooth-dnd'
import DraggableCard from './DraggableCard'
import { applyDrag } from "./utils";

const Hand = props => {
    const [cardsInHand, setCardsInHand] = useState([])

    const drawCard = () => {
        setCardsInHand(prevState => [
            ...prevState,
            props.drawCard
        ])
    }
    
    const drawStartingHand = () => {
        // console.log(props.drawStartingHand)
        setCardsInHand(prevState => [
            ...prevState,
            ...props.drawStartingHand
        ])
    }
    
    const drawRejectedCard = () => {
        setCardsInHand(prevState => [
            ...prevState,
            props.drawRejectedCard
        ])
    }

    const style = {
        
    }

    useEffect(() => {
        props.drawStartingHand && drawStartingHand()
    }, [props.drawStartingHand])

    useEffect(() => {
        props.drawCard && drawCard()
    }, [props.drawCard])

    useEffect(() => {
        // console.log(cardsInHand.indexOf(props.drawRejectedCard))
        // if (cardsInHand.indexOf(props.drawRejectedCard) < 0) {
            props.drawRejectedCard && drawRejectedCard() 
        // }
    }, [props.drawRejectedCard])

    return (
        <div>
            <Container name="hand" style={style} groupName="1" orientation="horizontal" getChildPayload={i => cardsInHand[i]} onDrop={e => setCardsInHand(applyDrag(cardsInHand, e))}>
                {cardsInHand && cardsInHand.map(item => <DraggableCard key={item.id} id={item.id} item={item} />)}
            </Container>
        </div>
    )

}

export default Hand