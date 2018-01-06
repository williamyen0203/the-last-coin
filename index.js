'use strict';

const Alexa = require('alexa-sdk');

const GAME_STATES = {
    START: '_STARTSTATE',
    GAME: '_GAMESTATE',
    HELP: '_HELPSTATE'
};

const APP_NAME = 'The Last Coin';
// TODO
const APP_ID = undefined;

const newSessionHandlers = {
    'LaunchRequest': function () {
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
    'Unhandled': function () {
        const speechOutput = 'Say start to start a new game.';
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },
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
            'coinsLeft': coinsTotal,
            'reprompt': reprompt
        });

        this.handler.state = GAME_STATES.GAME;
        this.emit(':responseReady');
    },
});

const gameStateHandlers = Alexa.CreateStateHandler(GAME_STATES.GAME, {
    //  'AnswerIntent': function () {
    //      handleUserGuess.call(this, false);
    //  },
    //  'AMAZON.StartOverIntent': function () {
    //      this.handler.state = GAME_STATES.START;
    //      this.emitWithState('StartGame', false);
    //  },
    //  'AMAZON.RepeatIntent': function () {
    //      this.response.speak(this.attributes['speechOutput']).listen(this.attributes['repromptText']);
    //      this.emit(':responseReady');
    //  },
    //  'AMAZON.HelpIntent': function () {
    //      this.handler.state = GAME_STATES.HELP;
    //      this.emitWithState('helpTheUser', false);
    //  },
    //  'AMAZON.StopIntent': function () {
    //      this.handler.state = GAME_STATES.HELP;
    //      const speechOutput = this.t('STOP_MESSAGE');
    //      this.response.speak(speechOutput).listen(speechOutput);
    //      this.emit(':responseReady');
    //  },
    //  'AMAZON.CancelIntent': function () {
    //      this.response.speak(this.t('CANCEL_MESSAGE'));
    //      this.emit(':responseReady');
    //  },
    //  'Unhandled': function () {
    //      const speechOutput = this.t('GAME_UNHANDLED', ANSWER_COUNT.toString());
    //      this.response.speak(speechOutput).listen(speechOutput);
    //      this.emit(':responseReady');
    //  },
    //  'SessionEndedRequest': function () {
    //      console.log(`Session ended in game state: ${this.event.request.reason}`);
    //  },
});

const helpStateHandlers = Alexa.CreateStateHandler(GAME_STATES.HELP, {
    //  'helpTheUser': function (newGame) {
    //      const askMessage = newGame ? this.t('ASK_MESSAGE_START') : this.t('REPEAT_QUESTION_MESSAGE') + this.t('STOP_MESSAGE');
    //      const speechOutput = this.t('HELP_MESSAGE', GAME_LENGTH) + askMessage;
    //      const repromptText = this.t('HELP_REPROMPT') + askMessage;

    //      this.response.speak(speechOutput).listen(repromptText);
    //      this.emit(':responseReady');
    //  },
    //  'AMAZON.StartOverIntent': function () {
    //      this.handler.state = GAME_STATES.START;
    //      this.emitWithState('StartGame', false);
    //  },
    //  'AMAZON.RepeatIntent': function () {
    //      const newGame = !(this.attributes['speechOutput'] && this.attributes['repromptText']);
    //      this.emitWithState('helpTheUser', newGame);
    //  },
    //  'AMAZON.HelpIntent': function () {
    //      const newGame = !(this.attributes['speechOutput'] && this.attributes['repromptText']);
    //      this.emitWithState('helpTheUser', newGame);
    //  },
    //  'AMAZON.YesIntent': function () {
    //      if (this.attributes['speechOutput'] && this.attributes['repromptText']) {
    //          this.handler.state = GAME_STATES.GAME;
    //          this.emitWithState('AMAZON.RepeatIntent');
    //      } else {
    //          this.handler.state = GAME_STATES.START;
    //          this.emitWithState('StartGame', false);
    //      }
    //  },
    //  'AMAZON.NoIntent': function () {
    //      const speechOutput = this.t('NO_MESSAGE');
    //      this.response.speak(speechOutput);
    //      this.emit(':responseReady');
    //  },
    //  'AMAZON.StopIntent': function () {
    //      const speechOutput = this.t('STOP_MESSAGE');
    //      this.response.speak(speechOutput).listen(speechOutput);
    //      this.emit(':responseReady');
    //  },
    //  'AMAZON.CancelIntent': function () {
    //      this.response.speak(this.t('CANCEL_MESSAGE'));
    //      this.emit(':responseReady');
    //  },
    //  'Unhandled': function () {
    //      const speechOutput = this.t('HELP_UNHANDLED');
    //      this.response.speak(speechOutput).listen(speechOutput);
    //      this.emit(':responseReady');
    //  },
    //  'SessionEndedRequest': function () {
    //      console.log(`Session ended in help state: ${this.event.request.reason}`);
    //  },
});

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, gameStateHandlers, helpStateHandlers);
    alexa.execute();
};