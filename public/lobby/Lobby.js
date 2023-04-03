
new class Lobby {

    #selectedLevelId = 0 // default level
    #localPlayerName = 'Player Name'

    constructor() {
        this.#declareButtonClicks()
        this.#setDefaultValues()
    }

    #setDefaultValues() {
        // set default local player name
        document.querySelector('#local-player-name-input').value = this.#localPlayerName
    }

    /**
     * declare buttons clicks
     * @return {void}
     */
    #declareButtonClicks() {
        const createLobbyBtn = document.querySelector('#create-lobby-btn')
        createLobbyBtn.addEventListener('click', () => {
            console.log('clicked')
        })

        const joinLobbyBtn = document.querySelector('#join-lobby-btn')
        joinLobbyBtn.addEventListener('click', () => {
            console.log('clicked')
        })

        const changeLocalPlayerNameBtn = document.querySelector('#change-local-player-name-btn')
        changeLocalPlayerNameBtn.addEventListener('click', () => {
            console.log('clicked')
        })

        // level selection images
        const levelSelectionImages = document.querySelectorAll('.level-img')
        levelSelectionImages.forEach(levelSelectionImage => {
            levelSelectionImage.addEventListener('click', (event) => {
                // get level id
                const levelId = event.target.dataset.levelId // example: 0, 1, 2...etc
                const levelName = event.target.dataset.levelName // example: Default Level...etc

                // store selected level id
                this.#selectedLevelId = levelId

                // remove previously selected level image style
                this.#removePreviouslySelectedLevelImageStyle()

                // mark selected level image style
                levelSelectionImage.classList.add('selected-level')

                // set selected level name
                document.querySelector('#selected-level-name').innerHTML = levelName

            })
        })
    }

    #removePreviouslySelectedLevelImageStyle() {
        const levelSelectionImages = document.querySelectorAll('.level-img')
        levelSelectionImages.forEach(levelSelectionImage => {
            // remove previously selected level image
            levelSelectionImage.classList.remove('selected-level')
        })
    }

    #setSelectedLevelName() {

    }
}