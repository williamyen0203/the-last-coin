"use strict";

const Alexa = require("alexa-sdk");

const GAME_STATES = {
    START: '_STARTSTATE',
    GAME: '_GAMESTATE'
};

const APP_NAME = 'The Last Coin';
// TODO
const APP_ID = undefined;

const newSessionHandlers = {
    LaunchRequest: function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = GAME_STATES.HELP;
        this.emitWithState("helpTheUser", true);
    },
    Unhandled: function () {
        const speechOutput = "Say start to start a new game.";
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(":responseReady");
    }
};

const startStateHandlers = Alexa.CreateStateHandler(GAME_STATES.START, {
    'StartGame': function (newGame) {
        let coinsTotal = 30;

        let intro = newGame ? "Welcome to The Last Coin. " : '';
        let reprompt = `There are ${coinsTotal} coins in the jar. If you can take the last coin, you win. You may take up to three coins at once. How many would you like to take?`;

        this.response.cardRenderer(APP_NAME, reprompt);
        this.response.speak(intro + reprompt)
            .listen(reprompt);

        Object.assign(this.attributes, {
            'coinsTotal': coinsTotal,
            'coinsLeft': coinsTotal
        });

        this.handler.state = GAME_STATES.GAME;
        this.emit(':responseReady');
    },
});

function getPrompt(coins) {
    return 'There are ${coins} coins in the jar. How many would you like to take?';
}


const gameStateHandlers = Alexa.CreateStateHandler(GAME_STATES.GAME, {
    'AnswerIntent': function () {
        handleUserGuess.call(this, false);
    },
    'AMAZON.StartOverIntent': function () {
        this.handler.state = GAME_STATES.START;
        this.emitWithState('StartGame', false);
    },
    'AMAZON.RepeatIntent': function () {
        this.response.speak(getPrompt(this.attributes['coinsLeft']));
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak('Thanks for playing! Come back soon!');
        this.emit(':responseReady');
    },
    'Unhandled': function () {
        const speechOutput = 'Say a number between 1 and 3.';
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
    'SessionEndedRequest': function () {
        console.log(`Session ended in game state: ${this.event.request.reason}`);
    },
});

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(
        newSessionHandlers,
        startStateHandlers,
        gameStateHandlers
    );
    alexa.execute();
};