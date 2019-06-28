'use strict';
require('dotenv').config();

const Alexa = require('ask-sdk-core');
const Skoob = require('./skoob');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    async handle(handlerInput) {
        let speechText = "Olá, sou seu consultor Skoob, em que posso ajudá-lo?";
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const InformacoesLivro = {
    canHandle(handlerInput) {
        return isTheIntent(handlerInput.requestEnvelope.request, 'InformacoesLivro');
    },
    async handle(handlerInput) {
        let speechText;
        const query = handlerInput.requestEnvelope.request.intent.slots.nomeLivro.value;
        try {
            const books = await Skoob.searchBook(query);
            if (books) {
                const book = books[0];
                const bookInfo = await Skoob.getBookData(book.livro_id);
                speechText = `O livro ${bookInfo.title} foi ranqueado com nota ${bookInfo.rating} de 5 entre suas ${bookInfo.ratingVotes} avaliações.\n
                              Eis aqui a descrição cadastrada: ${bookInfo.description}.\n
                              Há ${bookInfo.tradingUnits} disponíveis para troca no site.`;
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .withStandardCard(bookInfo.title, bookInfo.description, bookInfo.thumb, bookInfo.thumb)
                    .getResponse();
            } else {
                speechText = `Não consegui encontrar o livro solicitado, poderia repetir?`
                return handlerInput.responseBuilder
                    .speak(speechText)
                    .reprompt(speechText)
                    .getResponse();
            }
        } catch (error) {
            console.error(error);
            speechText = `Não consegui encontrar o livro solicitado, poderia repetir?`
            return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt(speechText)
                .getResponse();
        }
    }
}

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Até mais!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        //any cleanup logic goes here
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        let speechText = 'Desculpe, não consigo realizar isso agora, tente novamente';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Oopss', speechText)
            .getResponse();
    },
};

function isTheIntent(request, desiredIntent) {
    return request.type === 'IntentRequest' && request.intent.name === desiredIntent;

}

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        InformacoesLivro,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();

