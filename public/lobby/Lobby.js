
new class Lobby {

    // default selected level data
    #selectedLeveData = {
        levelId: 0,
        levelName: 'Default Level'
    } // default level

    #localPlayerName = 'Player Name'

    constructor() {
        this.#declareButtonClicks()
        this.#setDefaultValues()
        this.#createLobbyInServer()
        this.#receiveUpdatesFromServer()
    }

    #createLobbyInServer() {
        const data = {
            playerName: this.#localPlayerName,
            selectedLevelData: {
                levelId: this.#selectedLeveData.levelId,
                levelName: this.#selectedLeveData.levelName,
            },
        }
        socket.emit('createLobby', data);
    }

    /**
     * receive lobby updated from server
     */
    #receiveUpdatesFromServer() {
        /**
         * receive data from server when lobby is created
         * @param _data {object} example: {
         *     "lobbyId": 1680548252418,
         *     "players": [
         *         "Player Name"
         *     ],
         *     "selectedLevelData": {
         *         "levelId": 0,
         *         "levelName": "Default Level"
         *     }
         * }
         */
        socket.on('lobbyCreated', (_data) => {
            console.log(_data)
            // update lobby id
            document.querySelector('#joined-lobby-id-label').innerHTML = _data.lobbyId
            // update selected level label
            document.querySelector('#selected-level-name').innerHTML = _data.selectedLevelData.levelName
            // select selected level image
            this.#removePreviouslySelectedLevelImageStyle()
            this.#setSelectedLevelId(_data.selectedLevelData.levelId)

            // update players list
            const lobbyPlayers = _data.players
            this.#updatePlayersList(lobbyPlayers)
        })

        /**
         * change lobby selected level
         * @param _selectedLevelData {object} example: {levelId: 0, levelName: 'Default Level'}
         */
        socket.on('changeLobbySelectedLevel', (_selectedLevelData) => {
            this.#selectedLeveData = _selectedLevelData

            // select selected level
            this.#removePreviouslySelectedLevelImageStyle()
            this.#setSelectedLevelId(_selectedLevelData.levelId)

            // set selected level name
            document.querySelector('#selected-level-name').innerHTML = _selectedLevelData.levelName
        })

        /**
         * update lobby players data
         * @param _lobbyPlayersData {object} example: [
         *     {
         *         "name": "Player Name",
         *         "id": "Y8L1k6cu-IyUEvXEAAAF"
         *     }
         * ]
         */
        socket.on('updateLobbyPlayersList', (_lobbyPlayersData) => {
            this.#updatePlayersList(_lobbyPlayersData)
        })

        /**
         * recevie lobby join error
         * @params _error {string} example: Lobby ID not found
         */
        socket.on('lobbyJoinError', (_error) => {
            alert(_error)
        })

        /**
         * lobby joined successfully
         * @params _data {object} example: {playerName: 'John Doe'}
         */
        socket.on('lobbyJoinedSuccessfully', (_data) => {
            this.#localPlayerName = _data.playerName
            document.querySelector('#local-player-name-input').value = this.#localPlayerName

            // remove join or create lobby section
            document.querySelector('#join-or-create-lobby-section').remove()

            // show lobby section
            document.querySelector('#lobby-section').style.display = 'block'
        })
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
            // show create lobby section
            document.querySelector('#lobby-section').style.display = 'block'

            // remove join or create lobby section
            document.querySelector('#join-or-create-lobby-section').remove()
        })

        const joinLobbyBtn = document.querySelector('#join-lobby-btn')
        joinLobbyBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Join Lobby',
                html: `
                    <input id="swal-input1" class="swal2-input" placeholder="Lobby ID">
                    <input id="swal-input2" class="swal2-input" placeholder="Player Name">
                `,
                preConfirm: function (dataw) {
                    console.log(dataw)
                    const lobbyId = document.querySelector('#swal-input1').value
                    const playerName = document.querySelector('#swal-input2').value
                    // check lobby id
                    if (!lobbyId || lobbyId == '') {
                        Swal.showValidationMessage(
                            `Lobby ID cannot be empty!`
                        )
                        return;
                    }
                    // check player name
                    if (!playerName || playerName == '') {
                        Swal.showValidationMessage(
                            `Player name cannot be empty!`
                        )
                        return;
                    }

                    const joinedPlayerData = {
                        lobbyId,
                        playerName
                    }
                    socket.emit('joinLobbyId', joinedPlayerData)
                },
                onOpen: function () {
                    $('#swal-input1').focus()
                }
            })
        })

        const changeLocalPlayerNameBtn = document.querySelector('#change-local-player-name-btn')
        changeLocalPlayerNameBtn.addEventListener('click', () => {
            const newPlayerName = document.querySelector('#local-player-name-input').value

            // check name before sending to server
            if (!newPlayerName || newPlayerName == '') {
                alert('Player name cannot be empty')
                return;
            }

            // save local player name
            this.#localPlayerName = newPlayerName

            socket.emit('changeLobbyPlayerName', newPlayerName)
        })

        // level selection images
        const levelSelectionImages = document.querySelectorAll('.level-img')
        levelSelectionImages.forEach(levelSelectionImage => {
            levelSelectionImage.addEventListener('click', (event) => {
                // get level id
                const levelId = event.target.dataset.levelId // example: 0, 1, 2...etc
                const levelName = event.target.dataset.levelName // example: Default Level...etc

                // store selected level id
                this.#selectedLeveData.levelId = levelId
                this.#selectedLeveData.levelName = levelName

                // remove previously selected level image style
                this.#removePreviouslySelectedLevelImageStyle()

                // mark selected level image style
                levelSelectionImage.classList.add('selected-level')

                // set selected level name
                document.querySelector('#selected-level-name').innerHTML = levelName

                // update lobby selected level in server
                socket.emit('changeLobbySelectedLevel', this.#selectedLeveData);

            })
        })

        // start game button
        const startGameBtn = document.querySelector('#start-game-btn')
        startGameBtn.addEventListener('click', () => {
            const windowData = {
                winW: windowWidth,
                winL: windowHeight,
                decX: clientMap.decimalPlayerLocationX(),
                decY: clientMap.decimalPlayerLocationY(),
            }
            socket.emit('startLobbyGame', windowData);
        })
    }

    #removePreviouslySelectedLevelImageStyle() {
        const levelSelectionImages = document.querySelectorAll('.level-img')
        levelSelectionImages.forEach(levelSelectionImage => {
            // remove previously selected level image
            levelSelectionImage.classList.remove('selected-level')
        })
    }

    /**
     * set selected level id image
     * @param _levelId {string|number} example: 0, 1, 2...etc
     */
    #setSelectedLevelId(_levelId) {
        const levelSelectionImages = document.querySelectorAll('.level-img')
        levelSelectionImages.forEach(levelSelectionImage => {
            if (levelSelectionImage.dataset.levelId == _levelId) {
                levelSelectionImage.classList.add('selected-level')
            }
        })
    }

    /**
     * update players list
     * @param _playersData {object} example: [
     *     {
     *         "name": "Player Name",
     *         "id": "Y8L1k6cu-IyUEvXEAAAF"
     *     }
     * ]
     */
    #updatePlayersList(_playersData) {
        const playersList = document.querySelector('#lobby-players-list')

        // clear previous players names
        playersList.innerHTML = ''

        _playersData.forEach(playerData => {
            const playerName = document.createElement('h5')
            playerName.classList.add('my-2')
            playerName.innerHTML = playerData.name
            playersList.appendChild(playerName)
        })
    }
}