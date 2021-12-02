import React, { useState, useEffect } from 'react'
import { Grid, Button } from '@mui/material'
import CardContainer from './CardContainer'
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { database } from './firebaseUtils'

const CardContainerGrid = props => {
    const [containers, setContainers] = useState([])
    const [allContainersValidity, setAllContainersValidity] = useState([])
    const [isContainer0Valid, setIsContainer0Valid] = useState(false)
    const [cardsInEachContainer, setCardsInEachContainer] = useState([])
    const [boardId] = useState(props.boardId)
    const [isAddButtonDisabled, setIsAddButtonDisabled] = useState(false)
    const [isRemoveButtonDisabled, setIsRemoveButtonDisabled] = useState(false)

    const handleAddContainerPress = async () => {
        await updateDoc(doc(database, "cardContainer", boardId), {
            containers: arrayUnion(containers.length),
        })
    }

    const handleRemoveContainerPress = async () => {
        await updateDoc(doc(database, "cardContainer", boardId), {
            containers: arrayRemove(containers.length - 1)
        })
        setAllContainersValidity(prevState => [
            ...prevState.slice(0, prevState.length-1)
        ])
    }

    const handleIsContainerValid = (e, index) => {
        let temp = [...allContainersValidity]

        temp[index] = e
        setAllContainersValidity(temp)
    }

    const handleIsAddButtonDisabled = () => {
        setIsAddButtonDisabled(!allContainersValidity.every(Boolean))
    }

    const handleIsRemoveButtonDisabled = () => {
        setIsRemoveButtonDisabled(cardsInEachContainer[containers?.length-1]?.length > 0)
    }

    useEffect(() => {
        handleIsAddButtonDisabled()
    }, [allContainersValidity, containers])

    useEffect(() => {
        handleIsRemoveButtonDisabled()
    }, [cardsInEachContainer])

    useEffect(() => {
        const unsub = onSnapshot(doc(database, "cardContainer", props.boardId),
            // {includeMetadataChanges: true},
            doc => {
                setContainers(doc.data().containers)

                let temp = []
                for (let i=0; i<3; i++) {
                    temp.push(doc.data()[i])
                }

                setCardsInEachContainer(temp)
            }
        )

        return (
            () => unsub()
        )
    }, [props.cardContainerId])

    useEffect(() => {
        // console.log(allContainersValidity)
        // console.log(allContainersValidity.every(Boolean))
        props.areAllContainersValid(allContainersValidity.every(Boolean))

        if (allContainersValidity[0] && cardsInEachContainer[0].length > 2) {
            setIsContainer0Valid(true)
        } else {
            setIsContainer0Valid(false)
        }
    }, [allContainersValidity])

    useEffect(() => {
        props.isContainer0Valid(isContainer0Valid)
    }, [isContainer0Valid])

    return (
        <Grid container>
            {cardsInEachContainer && containers.map(index => 
                <Grid item xs={12} key={index}>
                    <CardContainer index={index} items={cardsInEachContainer[index]} boardId={boardId} cardContainerId={boardId} isValid={e => handleIsContainerValid(e, index)} />
                </Grid>)}
            <Button variant="contained" onClick={handleAddContainerPress} disabled={containers.length > 2 || isAddButtonDisabled}>Add container</Button>
            <Button variant="contained" onClick={handleRemoveContainerPress} disabled={containers.length < 1 || isRemoveButtonDisabled}>Remove container</Button>
        </Grid>
    )
}

export default CardContainerGrid