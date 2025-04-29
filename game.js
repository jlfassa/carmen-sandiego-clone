// ==================== DOM Elements ====================
const currentCityEl = document.getElementById('current-city');
const timeLeftEl = document.getElementById('time-left');
const warrantStatusEl = document.getElementById('warrant-status');
const investigationsLeftEl = document.getElementById('investigations-left');
const mainTextEl = document.getElementById('main-text');
const gameMessageEl = document.getElementById('game-message');
const initialActionsEl = document.getElementById('initial-actions');
const investigationActionsEl = document.getElementById('investigation-actions');
const travelActionsEl = document.getElementById('travel-actions');
const investigationButtonsContainer = document.getElementById('investigation-buttons');
const travelButtonsContainer = document.getElementById('travel-buttons');
const startGameButton = document.getElementById('start-game-button');
const openWarrantButton = document.getElementById('open-warrant-button');
const goToTravelButton = document.getElementById('go-to-travel-button');
const warrantModalBackdrop = document.getElementById('warrant-modal-backdrop');
const warrantInterfaceEl = document.getElementById('warrant-interface');
const warrantFormEl = document.getElementById('warrant-form');
const closeWarrantButton = document.getElementById('close-warrant-button');
const warrantGenderSelect = document.getElementById('warrant-gender');
const warrantHobbySelect = document.getElementById('warrant-hobby');
const warrantHairSelect = document.getElementById('warrant-hair');
const warrantFeatureSelect = document.getElementById('warrant-feature');
const warrantVehicleSelect = document.getElementById('warrant-vehicle');

// ==================== Game State ====================
let gameState = {};

// ==================== Game Constants ====================
const INITIAL_TIME = 168; // 7 days
const TIME_PER_TRAVEL = 6;
const TIME_PER_WRONG_TRAVEL = 10;
const TIME_PER_INVESTIGATION = 3;
const MAX_INVESTIGATIONS_PER_CITY = 3;

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Carmen Sandiego Clone Initializing...");
    setupEventListeners();
    populateWarrantOptions();
    resetGameState(); // Call reset ONCE here on load
    updateUI();
});

function setupEventListeners() {
    startGameButton.addEventListener('click', startGame);
    openWarrantButton.addEventListener('click', openWarrantInterface);
    closeWarrantButton.addEventListener('click', closeWarrantInterface);
    goToTravelButton.addEventListener('click', prepareTravelPhase);
    warrantFormEl.addEventListener('submit', handleWarrantSubmit);
}

function populateWarrantOptions() {
    warrantGenderSelect.innerHTML = '<option value="">--Select Gender--</option>';
    warrantHobbySelect.innerHTML = '<option value="">--Select Hobby--</option>';
    warrantHairSelect.innerHTML = '<option value="">--Select Hair Color--</option>';
    warrantFeatureSelect.innerHTML = '<option value="">--Select Accessory--</option>';
    warrantVehicleSelect.innerHTML = '<option value="">--Select Vehicle--</option>';
    getUniqueThiefProperties('gender').forEach(value => addOption(warrantGenderSelect, value, value));
    getUniqueThiefProperties('hobby').forEach(value => addOption(warrantHobbySelect, value, value));
    getUniqueThiefProperties('hair_color').forEach(value => addOption(warrantHairSelect, value, value));
    getUniqueThiefProperties('accessory').forEach(value => addOption(warrantFeatureSelect, value, value));
    getUniqueThiefProperties('vehicle').forEach(value => addOption(warrantVehicleSelect, value, value));
}

function addOption(selectElement, value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    selectElement.appendChild(option);
}

// ==================== Core Game Logic Functions ====================

function startGame() {
    console.log("Start New Case button clicked!");
    console.log("Starting new case...");
    resetGameState();
    gameState.currentCase = CASES[Math.floor(Math.random() * CASES.length)];
    gameState.targetThief = findThiefById(gameState.currentCase.ladrón_asignado_id);
    if (!gameState.currentCase || !gameState.targetThief) {
        console.error("Failed to load case or thief data.");
        mainTextEl.textContent = "Error: Could not start game. Missing data.";
        return;
    }
    gameState.currentCityId = gameState.currentCase.ciudad_inicial_id;
    gameState.currentCityIndex = 0;
    const startingCity = findCityById(gameState.currentCityId);
    if (!startingCity) {
         console.error("Starting city not found:", gameState.currentCityId);
         mainTextEl.textContent = "Error: Could not find starting city information.";
         return;
    }
    mainTextEl.textContent = `BRIEFING:\n\nDetective, the notorious ${gameState.targetThief.name} has struck again! They've made off with "${gameState.currentCase.objeto_robado}" from ${startingCity.name}, ${startingCity.country}. Initial reports suggest they are fleeing the scene. Your assignment is to track them down and recover the artifact.\n\nProceed to ${startingCity.name} immediately.`;
    gameMessageEl.textContent = `Time allocated: ${Math.floor(gameState.timeLeft / 24)} days.`;
    clearActionButtons();
    initialActionsEl.classList.add('hidden');
    investigationActionsEl.classList.add('hidden');
    travelActionsEl.classList.remove('hidden'); // Show travel section initially
    displayTravelButtons(true); // Pass flag for initial travel (no riddle needed)

    warrantModalBackdrop.classList.add('hidden'); // Ensure warrant modal is hidden
    openWarrantButton.disabled = false;
    updateUI();
}

function resetGameState() {
    console.log("Resetting game state...");
    gameState = {
        currentCase: null,
        targetThief: null,
        currentCityId: null,
        currentCityIndex: -1,
        timeLeft: INITIAL_TIME,
        warrantIssued: false,
        warrantCorrect: false,
        gameOver: false,
        collectedClues: {},
        investigationsLeft: MAX_INVESTIGATIONS_PER_CITY
    };
    warrantFormEl.reset();
    mainTextEl.textContent = "Awaiting briefing, Detective. Stand by...";
    gameMessageEl.textContent = "";
    currentCityEl.textContent = "CLASSIFIED";
    timeLeftEl.textContent = "ASSIGNMENT PENDING";
    warrantStatusEl.textContent = "No";
    investigationsLeftEl.textContent = "N/A";
    warrantStatusEl.className = 'status-no';
    clearActionButtons();
    initialActionsEl.classList.remove('hidden');
    investigationActionsEl.classList.add('hidden');
    travelActionsEl.classList.add('hidden');
    warrantModalBackdrop.classList.add('hidden');
    openWarrantButton.disabled = true;
    // Ensure start button text/icon/state is correct
    const startBtnIcon = startGameButton.querySelector('.btn-icon');
    const startBtnText = startGameButton.querySelector('.btn-action-text');
    if(startBtnIcon) startBtnIcon.className = 'fas fa-play btn-icon';
    if(startBtnText) {
        startBtnText.textContent = ' Accept New Case';
    } else {
         // Fallback if span isn't found
         startGameButton.innerHTML = `<i class="fas fa-play btn-icon"></i> Accept New Case`;
    }
    startGameButton.disabled = false;
    console.log("Game state reset complete.");
}


function travel(destinationCityId, isInitialTravel = false) {
     if (gameState.gameOver) return;
    console.log(`Attempting to travel to city ID: ${destinationCityId}`);

    const destinationCity = findCityById(destinationCityId);
    if (!destinationCity) {
        console.error("Invalid destination city ID:", destinationCityId);
        gameMessageEl.textContent = "Error: Invalid destination selected.";
        return;
    }

    let timeCost = TIME_PER_TRAVEL;
    let correctTravel = false;

    if (isInitialTravel) {
        correctTravel = true;
    } else {
        const correctNextCityId = gameState.currentCase.ruta_escape[gameState.currentCityIndex + 1];
        correctTravel = (destinationCityId === correctNextCityId);
        if (!correctTravel) {
            timeCost = TIME_PER_WRONG_TRAVEL;
            gameMessageEl.textContent = `Misdirection! That's not where the trail leads. Lost valuable time.`;
            console.log("Incorrect travel chosen.");
        } else {
             gameMessageEl.textContent = `Travel successful. Time cost: ${timeCost} hours.`;
        }
    }

    deductTime(timeCost);

    if (checkLossCondition("time_after_action")) return;

    if (correctTravel) {
        gameState.currentCityId = destinationCityId;
        if (!isInitialTravel) {
            gameState.currentCityIndex++;
        }
        gameState.investigationsLeft = MAX_INVESTIGATIONS_PER_CITY;
        if (!gameState.collectedClues[gameState.currentCityId]) {
            gameState.collectedClues[gameState.currentCityId] = [];
        }
        mainTextEl.textContent = `Arrived in ${destinationCity.name}, ${destinationCity.country}.\n\n${destinationCity.description_long || destinationCity.description_corta}\n\nTime to investigate.`;
        const isLastCity = gameState.currentCityIndex === gameState.currentCase.ruta_escape.length - 1;
        if (isLastCity && checkWinCondition()) { return; }
        showInvestigationOptions();
    } else {
        mainTextEl.textContent = `You remain in ${findCityById(gameState.currentCityId).name}. The trail seems to point elsewhere... Now, where to next?`;
        prepareTravelPhase();
    }
    updateUI();
}

function investigate(optionName, optionFocus) {
    if (gameState.gameOver || gameState.investigationsLeft <= 0) return;
    console.log(`Investigating via: ${optionName} (Focus: ${optionFocus}) in city: ${gameState.currentCityId}`);
    deductTime(TIME_PER_INVESTIGATION);
    gameState.investigationsLeft--;
    if (checkLossCondition("time_after_action")) return;
    const currentCity = findCityById(gameState.currentCityId);
    const targetThief = gameState.targetThief;
    if (!currentCity || !targetThief) { /* ... error handling ... */ return; }
    if (!gameState.collectedClues[gameState.currentCityId]) { gameState.collectedClues[gameState.currentCityId] = []; }
    const possibleClueIds = currentCity.possible_clues || [];
    const alreadyCollectedInCity = gameState.collectedClues[gameState.currentCityId];
    let relevantCluePool = [];
    // Destination clue
    const nextCityId = gameState.currentCase.ruta_escape[gameState.currentCityIndex + 1];
    if (nextCityId) {
        const destClue = CLUES.find(clue => clue.type === 'destination' && clue.value_associated === nextCityId && possibleClueIds.includes(clue.id) && !alreadyCollectedInCity.includes(clue.id));
        if (destClue) relevantCluePool.push(destClue);
    }
    // Identity clues
    const thiefProperties = ['gender', 'hobby', 'hair_color', 'accessory', 'vehicle'];
    thiefProperties.forEach(prop => {
        const thiefValue = targetThief[prop];
        const idClue = CLUES.find(clue =>
            clue.type === 'identity' &&
            clue.value_associated.property === prop &&
            clue.value_associated.value === thiefValue &&
            possibleClueIds.includes(clue.id) &&
            !alreadyCollectedInCity.includes(clue.id)
        );
        if (idClue) relevantCluePool.push(idClue);
    });

    let obtainedClues = [];
    let clueOutput = "";
    relevantCluePool.sort(() => 0.5 - Math.random());

    if (relevantCluePool.length > 0) {
        const clue1 = relevantCluePool.shift();
        obtainedClues.push(clue1);
        gameState.collectedClues[gameState.currentCityId].push(clue1.id);
        console.log("Found relevant clue 1:", clue1.id);
        if (relevantCluePool.length > 0) {
            const clue2 = relevantCluePool.find(c => c.type !== clue1.type) || relevantCluePool.shift();
             if (clue2){
                obtainedClues.push(clue2);
                gameState.collectedClues[gameState.currentCityId].push(clue2.id);
                console.log("Found relevant clue 2:", clue2.id);
             }
        }
    }
    // Fallback
    if (obtainedClues.length === 0) {
        const fallbackPool = possibleClueIds.filter(id => !alreadyCollectedInCity.includes(id));
        if (fallbackPool.length > 0) {
            const fallbackClueId = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
            const fallbackClue = findClueById(fallbackClueId);
            if (fallbackClue) {
                obtainedClues.push(fallbackClue);
                gameState.collectedClues[gameState.currentCityId].push(fallbackClue.id);
                console.log("Found fallback clue:", fallbackClue.id);
            }
        }
    }

    // Display
    if (obtainedClues.length > 0) {
        clueOutput = `Investigation Report: ${optionName}\n\n`;
        obtainedClues.forEach((clue, index) => {
            clueOutput += `Intel ${index + 1}: "${clue.witness_statement || clue.text_pista}"\n`;
        });
        gameMessageEl.textContent = `${obtainedClues.length} piece(s) of intel gathered. Time cost: ${TIME_PER_INVESTIGATION} hours.`;
    } else {
        clueOutput = `Your investigation via ${optionName} hits a dead end. No new leads here.`;
        gameMessageEl.textContent = `No new intel. Time cost: ${TIME_PER_INVESTIGATION} hours.`;
    }
    mainTextEl.textContent = clueOutput;

    updateUI();

    if (gameState.investigationsLeft <= 0) {
        gameMessageEl.textContent += ` No investigations remaining. Prepare for travel.`;
        prepareTravelPhase();
    }
}

function showInvestigationOptions() {
    if (gameState.gameOver) return;
    clearActionButtons();
    investigationActionsEl.classList.remove('hidden');
    travelActionsEl.classList.add('hidden');
    initialActionsEl.classList.add('hidden');
    const currentCity = findCityById(gameState.currentCityId);
    if (!currentCity || !currentCity.investigation_options) {
        console.error("Cannot show investigation options: City data or options missing.");
        prepareTravelPhase();
        return;
    }
    currentCity.investigation_options.forEach(option => {
        const button = createActionButton(
            option.name,
            () => investigate(option.name, option.focus),
            ['primary-action'],
            gameState.investigationsLeft <= 0
        );
        investigationButtonsContainer.appendChild(button);
    });
    goToTravelButton.disabled = false;
    updateUI();
}

function prepareTravelPhase() {
    if (gameState.gameOver) return;
    console.log("Preparing travel phase...");
    clearActionButtons();
    investigationActionsEl.classList.add('hidden');
    travelActionsEl.classList.remove('hidden');
    initialActionsEl.classList.add('hidden');
    const correctNextCityId = gameState.currentCase.ruta_escape[gameState.currentCityIndex + 1];
    if (!correctNextCityId) {
        mainTextEl.textContent = `This appears to be the final stop: ${findCityById(gameState.currentCityId).name}. There's nowhere left to run! If you have enough evidence, issue the warrant NOW!`;
        gameMessageEl.textContent = "Suspect cornered! Issue the warrant.";
        travelButtonsContainer.innerHTML = '';
        updateUI();
        return;
    }
    const destinationClue = CLUES.find(clue => clue.type === 'destination' && clue.value_associated === correctNextCityId);
    if (destinationClue && destinationClue.riddle_text) {
        mainTextEl.textContent = `Current Intel Suggests:\n\n"${destinationClue.riddle_text}"\n\nBased on this, where did the suspect flee?`;
        gameMessageEl.textContent = "Analyze the intel and choose the next destination.";
    } else {
        console.warn("Riddle text missing for destination clue:", correctNextCityId);
        mainTextEl.textContent = "Your investigation points towards a new location. Select the most likely destination based on your clues.";
        gameMessageEl.textContent = "Choose the next destination.";
    }
    displayTravelButtons();
    updateUI();
}

function displayTravelButtons(isInitial = false) {
    travelButtonsContainer.innerHTML = '';
    if (isInitial) {
        const startingCity = findCityById(gameState.currentCityId);
        if(startingCity){
            const button = createActionButton(
                `Travel to ${startingCity.name}, ${startingCity.country}`,
                () => travel(startingCity.id, true),
                ['primary-action']
            );
            travelButtonsContainer.appendChild(button);
        } else { console.error("Cannot create initial travel button: Starting city not found."); }
        return;
    }
    const correctNextCityId = gameState.currentCase.ruta_escape[gameState.currentCityIndex + 1];
    if (!correctNextCityId) { console.log("displayTravelButtons called, but no next city ID found."); return; }
    const correctCity = findCityById(correctNextCityId);
    let travelOptions = [];
    if (correctCity) { travelOptions.push(correctCity); }
    else { console.warn("Correct next city ID not found in CITIES:", correctNextCityId); }
    const numWrongOptions = 3;
    let wrongOptionsPool = CITIES.filter(city => city.id !== gameState.currentCityId && city.id !== correctNextCityId);
    wrongOptionsPool.sort(() => 0.5 - Math.random());
    travelOptions = travelOptions.concat(wrongOptionsPool.slice(0, numWrongOptions));
    travelOptions = [...new Set(travelOptions)];
    travelOptions.sort(() => 0.5 - Math.random());
    travelOptions.forEach(city => {
        const button = createActionButton(
            `${city.name}, ${city.country}`,
            () => travel(city.id),
            ['primary-action']
        );
        travelButtonsContainer.appendChild(button);
    });
}

function createActionButton(text, onClick, classes = [], disabled = false) {
    const button = document.createElement('button');
    button.onclick = onClick;
    button.disabled = disabled;
    button.classList.add('action-button', ...classes);
    let iconClass = 'fas fa-question-circle';
    if (classes.includes('primary-action')) {
        if (text.toLowerCase().includes('talk') || text.toLowerCase().includes('speak') || text.toLowerCase().includes('question') || text.toLowerCase().includes('inquire') || text.toLowerCase().includes('consult')) { iconClass = 'fas fa-comments'; }
        else if (text.toLowerCase().includes('check') || text.toLowerCase().includes('examine') || text.toLowerCase().includes('search') || text.toLowerCase().includes('visit') || text.toLowerCase().includes('investigate') || text.toLowerCase().includes('explore')) { iconClass = 'fas fa-search-location'; }
        else if (text.toLowerCase().includes('travel to')) { iconClass = 'fas fa-plane'; }
        else if (CITIES.some(city => text.includes(city.name))) { iconClass = 'fas fa-map-marked-alt'; }
    } else if (classes.includes('secondary-action') && text.toLowerCase().includes('travel')) { iconClass = 'fas fa-plane-departure'; }
    button.innerHTML = `<i class="${iconClass} btn-icon"></i> <span class="btn-action-text">${text}</span>`;
    return button;
}

function openWarrantInterface() {
     if (gameState.gameOver || gameState.warrantIssued) return;
    console.log("Opening warrant interface...");
    warrantModalBackdrop.classList.remove('hidden');
}

function closeWarrantInterface() {
     console.log("Closing warrant interface...");
    warrantModalBackdrop.classList.add('hidden');
    warrantFormEl.reset();
}

// *** CORRECTED handleWarrantSubmit ***
function handleWarrantSubmit(event) {
    event.preventDefault(); // Keep this
    if (gameState.gameOver || gameState.warrantIssued) return; // Keep this

    console.log("Processing warrant submission..."); // Keep this

    // KEEP THIS BLOCK - GET FORM DATA AND CHECK CORRECTNESS
    const formData = new FormData(warrantFormEl);
    const selectedFeatures = {
        gender: formData.get('gender'),
        hobby: formData.get('hobby'),
        hair_color: formData.get('hair_color'),
        accessory: formData.get('accessory'),
        vehicle: formData.get('vehicle')
    };
    const thief = gameState.targetThief;
    if (!thief) {
        console.error("Target thief not defined for warrant check.");
        gameMessageEl.textContent = "Error: Cannot verify warrant.";
        return;
    }
    gameState.warrantCorrect = (
        selectedFeatures.gender === thief.gender &&
        selectedFeatures.hobby === thief.hobby &&
        selectedFeatures.hair_color === thief.hair_color &&
        selectedFeatures.accessory === thief.accessory &&
        selectedFeatures.vehicle === thief.vehicle
    );
    // END OF BLOCK TO KEEP

    // Keep the rest of the logic
    gameState.warrantIssued = true;
    gameMessageEl.textContent = `Warrant logged. Accuracy: ${gameState.warrantCorrect ? 'MATCH CONFIRMED' : 'DISCREPANCIES NOTED'}.`;
    console.log("Warrant issued. Correct:", gameState.warrantCorrect);
    closeWarrantInterface();
    updateUI();
    const isLastCity = gameState.currentCityIndex === gameState.currentCase.ruta_escape.length - 1;
    if(isLastCity) {
        console.log("At last city, checking win condition after warrant issue.");
        if (!checkWinCondition()) {
             console.log("Win condition not met at final location despite warrant.");
        }
    } else {
         console.log("Warrant issued, but not at final location yet.");
    }
}


function deductTime(amount) {
     if (!gameState.gameOver) {
        gameState.timeLeft = Math.max(0, gameState.timeLeft - amount);
        console.log(`Time deducted: ${amount} hours. Time remaining: ${gameState.timeLeft} hours.`);
        updateUI();
    }
}

function checkWinCondition() {
      if (gameState.gameOver) return false;
     const isLastCity = gameState.currentCityIndex === gameState.currentCase.ruta_escape.length - 1;
     const currentCity = findCityById(gameState.currentCityId);
     if (!currentCity) return false;
     if (isLastCity && gameState.warrantIssued && gameState.warrantCorrect && gameState.timeLeft > 0) {
         console.log("WIN CONDITION MET!");
         mainTextEl.textContent = `SUCCESS!\n\nFollowing the trail to ${currentCity.name}, your accurate warrant allowed local authorities to apprehend ${gameState.targetThief.name}. The stolen "${gameState.currentCase.objeto_robado}" has been recovered!\n\nAnother case closed, Detective.`;
         gameMessageEl.textContent = "VICTORY! Case Closed.";
         endGame(true);
         return true;
     }
     else if (isLastCity && gameState.warrantIssued && !gameState.warrantCorrect && gameState.timeLeft > 0) {
         console.log("LOSS CONDITION: Reached end with incorrect warrant.");
         mainTextEl.textContent = `FAILURE!\n\nYou tracked the suspect to ${currentCity.name}, but the warrant details were wrong. ${gameState.targetThief.name} slipped through the net with "${gameState.currentCase.objeto_robado}".`;
         gameMessageEl.textContent = "DEFEAT! Suspect Escaped.";
         endGame(false);
         return true;
     }
     return false;
}

function checkLossCondition(triggerPoint) {
     if (gameState.gameOver) return true;
    if (gameState.timeLeft <= 0) {
        console.log("LOSS CONDITION: Time ran out.");
        mainTextEl.textContent = `FAILURE!\n\nYour time is up, Detective. ${gameState.targetThief.name} has vanished without a trace, along with "${gameState.currentCase.objeto_robado}".`;
        gameMessageEl.textContent = "DEFEAT! Out of Time.";
        endGame(false);
        return true;
    }
    return false;
}

function endGame(isVictory) {
    console.log(`Game Over. Victory: ${isVictory}`);
    gameState.gameOver = true;
    openWarrantButton.disabled = true;
    clearActionButtons();
    investigationActionsEl.classList.add('hidden');
    travelActionsEl.classList.add('hidden');
    initialActionsEl.classList.remove('hidden');
    const startBtnIcon = startGameButton.querySelector('.btn-icon');
    const startBtnText = startGameButton.querySelector('.btn-action-text');
    if(startBtnIcon) startBtnIcon.className = 'fas fa-play btn-icon';
    if(startBtnText) startBtnText.textContent = ' Start New Case';
    else { startGameButton.innerHTML = `<i class="fas fa-play btn-icon"></i> Start New Case`; }
    startGameButton.disabled = false;
    updateUI();
}


// ==================== UI Update Functions ====================

function updateUI() {
    const city = findCityById(gameState.currentCityId);
    currentCityEl.textContent = city ? `${city.name}, ${city.country}` : (gameState.gameOver ? "CASE CLOSED" : "CLASSIFIED");

    if (gameState.timeLeft !== undefined && !gameState.gameOver) {
        const days = Math.floor(gameState.timeLeft / 24);
        const hours = gameState.timeLeft % 24;
        timeLeftEl.textContent = `${days}d ${hours}h`;
        timeLeftEl.style.color = gameState.timeLeft < 24 ? 'var(--text-warrant-no)' : 'var(--text-mono)';
    } else if (gameState.gameOver) {
        timeLeftEl.textContent = "---";
         timeLeftEl.style.color = 'var(--text-mono)';
    } else {
        timeLeftEl.textContent = "ASSIGNMENT PENDING";
         timeLeftEl.style.color = 'var(--text-mono)';
    }

    if (gameState.warrantIssued !== undefined) {
        warrantStatusEl.textContent = gameState.warrantIssued ? (gameState.warrantCorrect ? "Correct" : "Incorrect") : "No";
        warrantStatusEl.className = gameState.warrantIssued ? (gameState.warrantCorrect ? 'status-yes' : 'status-no') : 'status-no';
    } else {
         warrantStatusEl.textContent = "No";
         warrantStatusEl.className = 'status-no';
    }

    if (gameState.investigationsLeft !== undefined && gameState.currentCityId && !gameState.gameOver) {
         investigationsLeftEl.textContent = `${gameState.investigationsLeft}/${MAX_INVESTIGATIONS_PER_CITY}`;
    } else {
         investigationsLeftEl.textContent = "N/A";
    }

    openWarrantButton.disabled = gameState.gameOver || gameState.warrantIssued || !gameState.currentCase;

    if (gameState.gameOver) {
        document.querySelectorAll('#investigation-buttons button, #travel-buttons button, #go-to-travel-button').forEach(btn => btn.disabled = true);
    }
     if(gameState.investigationsLeft !== undefined && gameState.investigationsLeft <= 0 && !gameState.gameOver) {
         document.querySelectorAll('#investigation-buttons button').forEach(btn => btn.disabled = true);
     }
}

function clearActionButtons() {
    investigationButtonsContainer.innerHTML = '';
    travelButtonsContainer.innerHTML = '';
}