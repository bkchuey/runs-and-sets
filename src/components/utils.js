export const applyDrag = (arr, dragResult) => {
    const { removedIndex, addedIndex, payload } = dragResult
    if (removedIndex === null && addedIndex === null) return arr

    const result = [...arr]
    let itemToAdd = payload

    if (removedIndex !== null) {
        itemToAdd = result.splice(removedIndex, 1)[0]
    }
    if (addedIndex !== null) {
        result.splice(addedIndex, 0, itemToAdd)
    }
    return result
}

// adds card only to top of discard pile
export const applyDragDiscard = (arr, dragResult) => {
    const { removedIndex, addedIndex, payload } = dragResult
    if (removedIndex === null && addedIndex === null) return arr

    const result = [...arr]
    let itemToAdd = payload

    if (removedIndex !== null) {
        itemToAdd = result.splice(removedIndex, 1)[0]
    }
    // adds item to top of discard pile
    if (addedIndex !== null) {
        // result.splice(0, 0, itemToAdd)
        result.push(itemToAdd)
    }
    return result
}

export const applyDragSet = (arr, dragResult) => {
    const { removedIndex, addedIndex, payload } = dragResult
    if (removedIndex === null && addedIndex === null) return arr

    const result = [...arr]
    let itemToAdd = payload

    if (removedIndex !== null) {
        itemToAdd = result.splice(removedIndex, 1)[0]
    }
    // adds item to front of set container
    if (addedIndex !== null) {
        result.splice(0, 0, itemToAdd)
    }
    return result
}

export const applyDragRun = (arr, dragResult, newCardIndex) => {
    const { removedIndex, addedIndex, payload } = dragResult
    if (removedIndex === null && addedIndex === null) return arr

    const result = [...arr]
    let itemToAdd = payload

    if (removedIndex !== null) {
        itemToAdd = result.splice(removedIndex, 1)[0]
    }
    // adds item to front or back of run container
    if (addedIndex !== null) {
        result.splice(newCardIndex, 0, itemToAdd)
    }
    return result
}

export const createDeck = () => {
    const suits = ['Diamonds', 'Clubs', 'Hearts', 'Spades']
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    let id = 1

    // const deck = suits.flatMap(suit => values.map(value => ({value: value, suit: suit, id: id++})))
    let deck = []
    for (let suit of suits) {
        for (let value of values) {
            let temp = {
                value: value,
                suit: suit,
                id: id++
            }
            // let temp2 = {
            //     value: value,
            //     suit: suit,
            //     id: id++
            // }
            // deck.push(temp, temp2)
            deck.push(temp)
        }
    }

    return shuffleDeck(deck)
}

 export const shuffleDeck = deck => {
    // for (let i = deck.length - 1; i > 0; i--) {
    //     let j = Math.floor(Math.random() * i)
    //     let temp = deck[i]
    //     deck[i] = deck[j]
    //     deck[j] = temp
    // }
    return deck
}