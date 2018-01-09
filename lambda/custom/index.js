/* jslint es6 */
'use strict';

const Alexa = require('alexa-sdk');

const GAME_STATES = {
    START: '_STARTSTATE',
    SETUP: '_SETUPSTATE',
    GAME: '_GAMESTATE',
    REPLAY: '_REPLAYSTATE'
};

const APP_NAME = 'The Last Coin';
const APP_ID = null;

const DIFFICULTY = {
    EASY: '_EASY',
    HARD: '_HARD'
};

const DIFFICULTY_CONFIG = {
    EASY: {
        COINS_TOTAL: 20,
        COIN_LIMIT: 3
    },
    HARD: {
        COINS_TOTAL: 40,
        COIN_LIMIT: 5
    }
};

const newSessionHandlers = {
    LaunchRequest: function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', true);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', true);
    },
    'AMAZON.HelpIntent': function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState('helpTheUser', true);
    },
    Unhandled: function () {
        const speechOutput = 'Say start to start a new game.';
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    }
};

const startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    StartGame: function (newGame) {
        let intro = newGame ? 'Welcome to The Last Coin. ' : '';
        intro += 'What difficulty would you like to play in? Easy or hard?';

        this.response.cardRenderer(APP_NAME);
        this.response.speak(intro).listen(intro);

        this.handler.state = GAME_STATES.SETUP;
        this.emit(':responseReady');
    }
});

const setupStateHandlers = Alexa.CreateStateHandler(GAME_STATES.SETUP, {
    EasyIntent: function() {
        let prompt = `There are ${DIFFICULTY_CONFIG.EASY.COINS_TOTAL} coins in the jar. If you can take the last coin, you win. You may take up to ${DIFFICULTY_CONFIG.EASY.COIN_LIMIT} coins at once. How many would you like to take?`;

        this.response.cardRenderer(APP_NAME, prompt);
        this.response.speak(prompt).listen(prompt);

        Object.assign(this.attributes, {
            coinsTotal: DIFFICULTY_CONFIG.EASY.COINS_TOTAL,
            coinsLeft: DIFFICULTY_CONFIG.EASY.COINS_TOTAL,
            coinLimit: DIFFICULTY_CONFIG.EASY.COIN_LIMIT,
            difficulty: DIFFICULTY.EASY
        });

        this.handler.state = GAME_STATES.GAME;
        this.emit(':responseReady');
    },
    HardIntent: function() {
        let prompt = `There are ${DIFFICULTY_CONFIG.HARD.COINS_TOTAL} coins in the jar. If you can take the last coin, you win. You may take up to ${DIFFICULTY_CONFIG.HARD.COIN_LIMIT} coins at once. How many would you like to take?`;

        this.response.cardRenderer(APP_NAME, prompt);
        this.response.speak(prompt).listen(prompt);

        Object.assign(this.attributes, {
            coinsTotal: DIFFICULTY_CONFIG.HARD.COINS_TOTAL,
            coinsLeft: DIFFICULTY_CONFIG.HARD.COINS_TOTAL,
            coinLimit: DIFFICULTY_CONFIG.HARD.COIN_LIMIT,
            difficulty: DIFFICULTY.HARD
        });

        this.handler.state = GAME_STATES.GAME;
        this.emit(':responseReady');
    }
});

function getPrompt(coins) {
    return `There are ${coins} coins in the jar. How many would you like to take?`;
}

function isAnswerSlotValid(intent) {
    const answerSlotFilled = intent && intent.slots && intent.slots.Answer && intent.slots.Answer.value;
    const answerSlotIsInt = answerSlotFilled && !isNaN(parseInt(intent.slots.Answer.value, 10));
    return (
        answerSlotIsInt &&
        parseInt(intent.slots.Answer.value, 10) <= Math.min(this.attributes.coinLimit, this.attributes.coinsLeft) && parseInt(intent.slots.Answer.value, 10) >= 1
    );
}

function calculateCoinsToTake() {
    let coinsToTake = Math.min(Math.floor(Math.random() * this.attributes.coinLimit + 1), this.attributes.coinsLeft);
    let remainder = this.attributes.coinsLeft - (Math.floor(this.attributes.coinsLeft / (this.attributes.coinsLimit + 1)));

    if (this.attributes.difficulty === DIFFICULTY.HARD && remainder !== 0) {
        coinsToTake = remainder;
    }
    return coinsToTake;
}

function handleUserGuess() {
    const answerSlotValid = isAnswerSlotValid.call(this, this.event.request.intent);
    let speechOutput = '';

    if (answerSlotValid) {
        const answer = parseInt(this.event.request.intent.slots.Answer.value, 10);
        let coinsLeft = this.attributes.coinsLeft;

        // check if user has won game
        if (answer === coinsLeft) {
            speechOutput = 'Looks like you won! Would you like to play again?';
            this.response.cardRenderer(APP_NAME, speechOutput);
            this.response.speak(speechOutput).listen(speechOutput);

            this.handler.state = GAME_STATES.REPLAY;
            this.emit(':responseReady');
        } else {
            coinsLeft -= answer;
        }

        const coinsTotal = this.attributes.coinsTotal;
        const difficulty = this.attributes.difficulty;
        const coinLimit = this.attributes.coinLimit;

        // check if Alexa has won the game
        if (coinsLeft <= coinLimit) {
            speechOutput = 'I take the last ';
            speechOutput += (coinsLeft > 1) ? `${coinsLeft} coins. ` : 'coin. ';
            speechOutput += 'Looks like I won! Would you like to play again?';
            this.response.cardRenderer(APP_NAME, speechOutput);
            this.response.speak(speechOutput).listen(speechOutput);

            this.handler.state = GAME_STATES.REPLAY;
            this.emit(':responseReady');
        } else {
            const coinsToTake = calculateCoinsToTake.call(this);
            const currentCoins = coinsLeft - coinsToTake;
            Object.assign(this.attributes, {
                coinsTotal: coinsTotal,
                coinsLeft: currentCoins,
                coinLimit: coinLimit,
                difficulty: difficulty
            });

            speechOutput = `I take ${coinsToTake} coin`;
            speechOutput += (coinsToTake > 1) ? 's. ' : '. ';
            speechOutput += (currentCoins > 1) ? `There are now ${currentCoins} coins ` : 'There is now one coin ';
            speechOutput += `left in the jar. How many coins would you like to take?`;
            this.response.cardRenderer(APP_NAME, speechOutput);
            this.response.speak(speechOutput).listen(speechOutput);
        }
    } else {
        if (this.attributes.coinsLeft === 1) {
            speechOutput = 'There is only one coin left in the jar. How many coins do you want to take?';
        } else {
            speechOutput = `Please say a number between 1 and ${Math.min(this.attributes.coinsLeft, this.attributes.coinLimit)}.`;
        }

        this.response.cardRenderer(APP_NAME, speechOutput);
        this.response.speak(speechOutput).listen(speechOutput);
    }

    this.emit(':responseReady');
}

const gameStateHandlers = Alexa.CreateStateHandler(GAME_STATES.GAME, {
    AnswerIntent: function () {
        handleUserGuess.call(this);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', false);
    },
    'AMAZON.RepeatIntent': function () {
        this.response
            .speak(getPrompt(this.attributes.coinsLeft))
            .listen(getPrompt(this.attributes.coinsLeft));
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('Thanks for playing! Come back soon!');
        this.emit(':responseReady');
    },
    Unhandled: function () {
        let speechOutput = '';
        if (this.attributes.coinsLeft === 1) {
            speechOutput = 'There is only one coin left in the jar. How many coins do you want to take?';
        } else {
            speechOutput = `Please say a number between 1 and ${Math.min(this.attributes.coinsLeft, this.attributes.coinLimit)}.`;
        }
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
    SessionEndedRequest: function () {
        console.log(`Session ended in game state: ${this.event.request.reason}`);
    }
});

const replayStateHandlers = Alexa.CreateStateHandler(GAME_STATES.REPLAY, {
    'YesIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', false);
    },
    'NoIntent': function () {
        this.response.speak('Thanks for playing! Come back soon!');
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('Thanks for playing! Come back soon!');
        this.emit(':responseReady');
    },
    Unhandled: function () {
        const speechOutput = 'Please say yes or no.';
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    }
});

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(
        newSessionHandlers,
        setupStateHandlers,
        startStateHandlers,
        gameStateHandlers,
        replayStateHandlers
    );
    alexa.execute();
};