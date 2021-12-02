import React, { useState, useEffect } from 'react'
import Game from './Game';
import JoinCreateRoom from './JoinCreateRoom';
import Room from './Room'
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { database, initializePlayer, getRoomCodes, getGameCodes } from './firebaseUtils';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { onSnapshot, collection } from '@firebase/firestore'

const App = props => {
    const auth = getAuth()
    const [playerId, setPlayerId] = useState()
    const [roomPath, setRoomPath] = useState()
    const [gamePath, setGamePath] = useState()
    const [roomCodes, setRoomCodes] = useState()
    const [gameCodes, setGameCodes] = useState()
    const [alreadyInBoard, setAlreadyInBoard] = useState()

    const getPlayer = async (uid) => {
        setPlayerId(uid)
        setAlreadyInBoard(await initializePlayer(uid))
    }

    const allRoomCodes = async () => {
        let temp = await getRoomCodes()
        setRoomCodes(temp)
        setRoomPath("/room/:roomCode(" + temp.join('|') + ")")
    }

    const allGameCodes = async () => {
        let temp = await getGameCodes()
        setGameCodes(temp)
        setGamePath("/game/:roomCode(" + temp.join('|') + ")")
    }

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                getPlayer(user.uid)
            } else {
                signInAnonymously(auth)
            }
        })

        return () => {
            unsub()
        }
    }, [])

    useEffect(() => {
        const unsub = onSnapshot(collection(database, "room"), () => {
            allRoomCodes()
        })

        return () => {
            unsub()
        }
    }, [])

    useEffect(() => {
        const unsub = onSnapshot(collection(database, "game"), () => {
            allGameCodes()
        })

        return () => {
            unsub()
        }
    }, [])


    return (
        <div>
            {roomPath && gamePath && playerId &&
            <Router>
                {/* {console.log(gamePath)}
                {console.log(roomPath)} */}
                <Switch>
                    <Route path={gamePath} render={props => {
                        return <Game {...props} playerId={playerId} />
                    }} />
                    <Route path={roomPath} render={props => {
                        return <Room {...props} playerId={playerId} />
                    }} />
                    <Route path="/" render={props => {
                        return <JoinCreateRoom {...props} roomCodes={roomCodes} alreadyInBoard={alreadyInBoard}/>
                    }} />
                </Switch>
            </Router>}
        </div>
    )
}

export default App