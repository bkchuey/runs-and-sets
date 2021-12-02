import React, { useState, useEffect } from 'react'
import { Button, Container as MuiContainer, TextField, Typography, Grid, Card, CardContent, FormControl, InputAdornment, IconButton } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { database, addPlayerToRoom, removePlayerFromRoom, initializeGame, setStartGameInRoom } from './firebaseUtils';
import { doc, onSnapshot } from '@firebase/firestore'

const Room = props => {
    const [roomCode] = useState(props.match.params.roomCode)
    const [playerId] = useState(props.playerId)
    const [playersInRoom, setPlayersInRoom] = useState([])
    const [isReady, setIsReady] = useState(false)
    const [numPlayers] = useState(2)
    const [isGameStarted, setIsGameStarted] = useState(false)

    const addPlayer = async () => {
        await addPlayerToRoom(roomCode, playerId)
    }

    const removePlayer = async () => {
        await removePlayerFromRoom(roomCode, playerId)
    }

    const handleReadyPress = () => {
        setIsReady(prevState => !prevState)
    }

    const startGame = async () => {
        try {
            await initializeGame(roomCode, [playersInRoom])
            await setStartGameInRoom(roomCode)
        } catch (error) {
            console.log(error)
        }
    }

    const cardStyle = {
        backgroundColor: '#ecf0f1',
    }

    useEffect(() => {
        if (playersInRoom.length === numPlayers) startGame()
    }, [playersInRoom])

    useEffect(() => {
        isGameStarted && props.history.push('/game/' + roomCode)
    }, [isGameStarted])

    useEffect(() => {
        if (isReady) addPlayer()
        if (!isReady) removePlayer()
    }, [isReady])

    useEffect(() => {
        const unsub = onSnapshot(doc(database, "room", props.match.params.roomCode), doc => {
            setPlayersInRoom(doc.data().players)
            setIsGameStarted(doc.data().isGameStarted)
        })

        return () => {
            unsub()
        }
    }, [])

    return (
        <MuiContainer>
            <Grid container align="center" justifyContent="center" spacing={2}>
                <Grid item xs={4}>
                    <Card style={cardStyle} raised={true}>
                        <CardContent>
                            <Typography variant="h4">Room<br />{props.match.params.roomCode}</Typography>
                        </CardContent>
                        <CardContent>
                            <TextField fullWidth value={window.location.href} InputProps={{
                                endAdornment: <InputAdornment position="end">
                                    <IconButton onClick={() => {navigator.clipboard.writeText(window.location.href)}}><ContentCopyIcon /></IconButton>
                                </InputAdornment>
                            }} />
                        </CardContent>
                        <CardContent>
                            <Typography>
                                Game will start when everyone is ready.
                            </Typography>
                            <Typography>
                                ({playersInRoom.length}/{numPlayers})
                            </Typography>
                            {isGameStarted &&
                            <Typography>
                                Starting game...
                            </Typography>}
                        </CardContent>
                        <CardContent>
                            <Button variant="contained" color={isReady ? "error" : "success"} onClick={handleReadyPress}>{isReady ? "Cancel" : "Ready"}</Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </MuiContainer>
    )
}

export default Room
