import React, { useState, useEffect } from 'react'
import { Card, CardContent, Typography } from '@mui/material'
import { Draggable } from 'react-smooth-dnd'
import { SuitDiamondFill, SuitClubFill, SuitHeartFill, SuitSpadeFill } from 'react-bootstrap-icons'

const DraggableCard = props => {
    const [cardInfo, setCardInfo] = useState(props.item)

    const getSuitIcon = () => {
        if (cardInfo.suit === 'Diamonds') return <SuitDiamondFill />
        if (cardInfo.suit === 'Clubs') return <SuitClubFill />
        if (cardInfo.suit === 'Hearts') return <SuitHeartFill />
        if (cardInfo.suit === 'Spades') return <SuitSpadeFill />
    }

    const getCardValue = () => {
        if (cardInfo.value === 11) return 'J'
        if (cardInfo.value === 12) return 'Q'
        if (cardInfo.value === 13) return 'K'
        if (cardInfo.value === 1) return 'A'
        return cardInfo.value
    }

    const style = {
        height: '165px',
        width: '150px',
        marginRight: '-13px',
        backgroundColor: '#ecf0f1',
        color: cardInfo.suit === 'Diamonds' || cardInfo.suit === 'Hearts' ? 'red' : 'black',
    }

    useEffect(() => {
        setCardInfo(props.item)
    }, [props.item])

    return (
        <Draggable>
            <Card raised={true} style={style}>
                <CardContent>
                    <Typography variant="h6">
                        {getCardValue()} {getSuitIcon()}
                    </Typography>
                    <CardContent>
                        <Typography align="center" variant="h4">
                            {getSuitIcon()}
                        </Typography>
                    </CardContent>
                    <Typography align="right" variant="h6">
                        {getSuitIcon()} {getCardValue()}
                    </Typography>
                </CardContent>
            </Card>
        </Draggable>
    )
}

export default DraggableCard