import { Button, Container as MuiContainer, TextField, Typography, Grid, Card, CardContent, FormControl } from '@mui/material'
import React, { useState, useEffect } from 'react'
import { createRoom } from './firebaseUtils'

const JoinCreateRoom = props => {
    const [roomCodes] = useState(props.roomCodes)
    const [isRoomCodeInputOpen, setIsRoomCodeInputOpen] = useState(false)
    const [tempRoomCode, setTempRoomCode] = useState()
    const [prevRoomCodeAttempt, setPrevRoomCodeAttempt] = useState()
    const [isError, setIsError] = useState(false)
    const [newRoomRef, setNewRoomRef] = useState()
    const [isCreateDisabled, setIsCreateDisabled] = useState(false)
    
    const handleJoinRoom = () => {
        setIsRoomCodeInputOpen(prevState => !prevState)
    }

    const handleCreateRoom = async () => {
        setIsRoomCodeInputOpen(false)

        if (roomCodes.length > 5) {
            setIsCreateDisabled(true)
        } else {
            setNewRoomRef(await createRoom())
        }
    }
    
    const handleRoomCodeInputChange = e => {
        setTempRoomCode(e)
        setIsError(false)
    }

    const handleJoinPress = () => {
        if (tempRoomCode === prevRoomCodeAttempt) {
            // setIsError(true)
        } else if (roomCodes.includes(tempRoomCode)) {
            props.history.push('/room/' + tempRoomCode)
        } else {
            setPrevRoomCodeAttempt(tempRoomCode)
            setIsError(true)
        }
    }

    const cardStyle = {
        backgroundColor: '#ecf0f1',
    }

    useEffect(() => {
        if (props.alreadyInBoard) props.history.push('/game/' + props.alreadyInBoard)
        else props.history.push('/')
    }, [])

    useEffect(() => {
        newRoomRef && props.history.push('/room/' + newRoomRef)
    }, [newRoomRef])

    return (
        <div> 
            <MuiContainer>
                <Grid container align="center" justifyContent="center" spacing={2}>
                    <Grid item xs={4}>
                        <Card style={cardStyle} raised={true}>
                            <CardContent>
                                <Typography variant="h4">Welcome!</Typography>
                            </CardContent>
                            <CardContent>
                                <Button variant={isRoomCodeInputOpen ? "outlined" : "contained"} onClick={handleJoinRoom}>Join Room</Button>
                                <Button variant="contained" onClick={handleCreateRoom} disabled={isCreateDisabled}>Create Room</Button>
                            </CardContent>
                            {isRoomCodeInputOpen && 
                            <CardContent>
                                <FormControl>
                                    <TextField error={isError} helperText={isError && "Room not found."} label="Room code" variant="standard" onChange={e => handleRoomCodeInputChange(e.target.value)}/>
                                    <br />
                                    <Button variant="contained" onClick={handleJoinPress}>Join</Button>
                                </FormControl>
                            </CardContent>}
                            {isCreateDisabled && !isRoomCodeInputOpen && 
                            <CardContent>
                                <Typography color="error">
                                    Too many rooms!<br />Room creation disabled.
                                </Typography>
                            </CardContent>}
                        </Card>
                    </Grid>
                </Grid>
            </MuiContainer>
        </div>
    )
}

export default JoinCreateRoom
