'use strict';

const Alexa = require('alexa-sdk');

const GAME_STATES = {
    START: '_STARTSTATE',
    GAME: '_GAMESTATE',
    REPLAY: '_REPLAYSTATE'
};

const APP_NAME = 'The Last Coin';
const APP_ID = null;

const DIFFICULTY = {
    EASY: '_EASY',
    HARD: '_HARD'
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

const coinsTotal = 30;

const startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    StartGame: function (newGame) {
        let intro = newGame ? 'Welcome to The Last Coin. ' : '';
        let reprompt = `There are ${coinsTotal} coins in the jar. If you can take the last coin, you win. You may take up to three coins at once. How many would you like to take?`;

        this.response.cardRenderer(APP_NAME, reprompt);
        this.response.speak(intro + reprompt).listen(reprompt);

        Object.assign(this.attributes, {
            coinsTotal: coinsTotal,
            coinsLeft: coinsTotal,
            difficulty: DIFFICULTY.EASY
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
        parseInt(intent.slots.Answer.value, 10) <= Math.min(3, this.attributes['coinsLeft']) && parseInt(intent.slots.Answer.value, 10) >= 1
    );
}

function calculateCoinsToTake() {
    return Math.min(
        Math.floor(Math.random() * 3 + 1),
        this.attributes['coinsLeft']
    );
}

function handleUserGuess() {
    const answerSlotValid = isAnswerSlotValid.call(this, this.event.request.intent);
    let speechOutput = '';

    if (answerSlotValid) {
        const answer = parseInt(this.event.request.intent.slots.Answer.value, 10);
        let coinsLeft = this.attributes['coinsLeft'];

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

        // check if Alexa has won the game
        if (coinsLeft <= 3) {
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
                difficulty: DIFFICULTY.EASY
            });

            speechOutput = `I take ${coinsToTake} coin`;
            speechOutput += (coinsToTake > 1) ? 's. ' : '. ';
            speechOutput += (currentCoins > 1) ? `There are now ${currentCoins} coins ` : 'There is now one coin ';
            speechOutput += `left in the jar. How many coins would you like to take?`;
            this.response.cardRenderer(APP_NAME, speechOutput);
            this.response.speak(speechOutput).listen(speechOutput);
        }
    } else {
        if (this.attributes['coinsLeft'] === 1) {
            speechOutput = 'There is only one coin left in the jar. How many coins do you want to take?';
        } else {
            speechOutput = `Please say a number between 1 and ${Math.min(this.attributes['coinsLeft'], 3)}.`;
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
            .speak(getPrompt(this.attributes['coinsLeft']))
            .listen(getPrompt(this.attributes['coinsLeft']));
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('Thanks for playing! Come back soon!');
        this.emit(':responseReady');
    },
    Unhandled: function () {
        let speechOutput = '';
        if (this.attributes['coinsLeft'] === 1) {
            speechOutput = 'There is only one coin left in the jar. How many coins do you want to take?';
        } else {
            speechOutput = `Please say a number between 1 and ${Math.min(this.attributes['coinsLeft'], 3)}.`;
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
        startStateHandlers,
        gameStateHandlers,
        replayStateHandlers
    );
    alexa.execute();
};