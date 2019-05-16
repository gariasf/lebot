const fetch = require('node-fetch');

import { BotWrapperInstance, PhrasesHandlerInstance } from './instance-handler';

import {
  FORGET_PHRASE_REGEX,
  SAY_THIS_REGEX,
  SHUT_UP_REGEX,
  CAT_API_URI,
  CAT_GIF_API_URI,
  DOG_API_URI,
  DEFAULT_SHUTUP_INTERVAL
} from './consts';

export default class ChatHandler {
  constructor() {
    this.apiBot = BotWrapperInstance.getBotApiInstance();
    this.shutUpUntil = null;
  }

  shutUp(mesageContent, chatId) {
    if (this.shutUpUntil !== null) {
      return;
    }

    const specifiedInterval =
      SHUT_UP_REGEX.exec(mesageContent).groups.interval ||
      DEFAULT_SHUTUP_INTERVAL;

    if (specifiedInterval >= Number.MAX_SAFE_INTEGER - 1) {
      this.sendMessage(
        chatId,
        `Onde vas, espavilao, que te crees que me puedes destruir así de facil o que? Pff, puto principiante de mierda. Intentalo de nuevo, no hay huevos.`
      );
    }

    const nowEpoch = new Date(Date.now()).getTime();
    const nowPlusIntervalEpoch = nowEpoch + specifiedInterval * 60000;

    this.sendMessage(
      chatId,
      `Ok, tienes ${specifiedInterval} minuto${
        specifiedInterval > 1 ? 's' : ''
      } antes de que mis palabras te destruyan`
    );

    this.shutUpUntil = nowPlusIntervalEpoch;
  }

  disableShutUp(chatId) {
    this.shutUpUntil = null;
    this.sendMessage(
      chatId,
      "Ueeeee ya puedo hablaaaar, ahi os caiga un piano encima cohone'!"
    );
  }

  /**
   * Send a text message to a chat
   * @param {number} chatId
   * @param {string} content
   */
  sendMessage(chatId, content) {
    if (this.isShutUp()) {
      return;
    } else {
      this.shutUpUntil = null;
    }

    this.apiBot.sendMessage(chatId, content).catch(err => {
      console.error(err);
    });
  }

  isShutUp() {
    const nowEpoch = new Date(Date.now()).getTime();

    return this.shutUpUntil !== null && nowEpoch < this.shutUpUntil;
  }

  /**
   * Fetch cat image/gif uri and send it
   * @param {number} chatId
   */
  sendCatGif(chatId) {
    const sendGifChance = Math.random() >= 0.5;
    const mediaSource = sendGifChance ? CAT_GIF_API_URI : CAT_API_URI;

    fetch(mediaSource)
      .then(response => response.json())
      .then(result => {
        sendGifChance
          ? this.apiBot.sendDocument(chatId, result[0].url)
          : this.apiBot.sendPhoto(chatId, result[0].url);
      });
  }

  /**
   * Fetch dog image uri and send it
   * @param {number} chatId
   */
  sendDogGif(chatId) {
    // TODO: refacor repeated code
    fetch(DOG_API_URI)
      .then(response => response.json())
      .then(result => {
        this.apiBot.sendPhoto(chatId, result.message);
      });
  }

  /**
   * Phrase deletion interaction
   * @param {string} messageContent
   * @param {number} chatId
   */
  async deletePhrase(messageContent, chatId) {
    let deletionResult = false;
    const phraseTrigger = FORGET_PHRASE_REGEX.exec(messageContent).groups
      .trigger;
    const triggerResponseArray = await PhrasesHandlerInstance.getTriggerMatchingPhrases(
      phraseTrigger
    );

    if (triggerResponseArray.length === 1) {
      deletionResult = await PhrasesHandlerInstance.removePhrase(
        triggerResponseArray[0]
      );
    } else {
      // ask for which one
    }

    if (deletionResult) {
      this.sendMessage(chatId, 'Frase eliminada!');
    } else {
      this.sendMessage(
        chatId,
        'A ver, o la frase no existe o me ha explotado el cerebro, una de dos...'
      );
    }
  }

  /**
   * Learn new phrase interaction
   * @param {string} messageContent
   * @param {number} chatId
   */
  async learnNewPhrase(messageContent, chatId) {
    const learnPhraseResult = await PhrasesHandlerInstance.learnNewPhrase(
      messageContent
    );

    this.sendMessage(chatId, learnPhraseResult);
  }

  /**
   * Get matching trigger and send a random response from the available
   * @param {string} messageContent
   * @param {number} chatId
   */
  async getAndSendKnownPhrase(messageContent, chatId) {
    const knownPhrase = await PhrasesHandlerInstance.getRandomMatchingPhrase(
      messageContent
    );

    if (knownPhrase) {
      this.sendMessage(chatId, knownPhrase);
    }
  }

  /**
   * Tag all admins in the chat
   * @param {number} chatId
   */
  async sendAdminSpam(chatId, chatType) {
    // TODO: Refactor repeated code (I don't like how this is handled)
    if (this.isShutUp()) {
      return;
    } else {
      this.shutUpUntil = null;
    }

    if (chatType === 'group' || chatType === 'supergroup') {
      const chatAdminUserList = await this.apiBot
        .getChatAdministrators(chatId)
        .catch(err => {
          console.error(err.body.description);
          return;
        });

      let spamMessage = '';

      chatAdminUserList.forEach(adminUser => {
        if (adminUser.user.username) {
          spamMessage += ` @${adminUser.user.username}`;
        }
      });

      await this.apiBot.sendMessage(chatId, spamMessage);
    } else {
      console.log("Can't spam private chat");
      this.apiBot.sendMessage(
        chatId,
        'A quien quieres spamear, si solo estamos tu y yo jajajajaj'
      );
    }
  }

  /**
   * Say something and spam admins when a new game is started
   * @param {number} chatId
   * @param {string} chatType
   */
  reactToNewGame(chatId, chatType) {
    // TODO: Refactor repeated code (I don't like how this is handled)
    if (this.isShutUp()) {
      return;
    } else {
      this.shutUpUntil = null;
    }

    if (chatType === 'group' || chatType === 'supergroup') {
      this.sendMessage(
        chatId,
        'Quereis empezar una partida? Eso merece un buen patataspam!'
      );
      this.sendAdminSpam(chatId, chatType);
    } else {
      this.apiBot.sendMessage(
        chatId,
        '/start "humano de mierda", que cojones intentas?'
      );
      console.log("Can't react to a game in private");
    }
  }

  /**
   * Send whatever it is told to say to the chat
   * @param {number} chatId
   * @param {string} messageContent
   */
  sayThis(chatId, messageContent) {
    const whatToSay = SAY_THIS_REGEX.exec(messageContent).groups.whattosay;

    this.sendMessage(chatId, whatToSay);
  }
}
