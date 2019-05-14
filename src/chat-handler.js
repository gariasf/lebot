const fetch = require('node-fetch');

import { BotWrapperInstance, PhrasesHandlerInstance } from './instance-handler';

import {
  FORGET_PHRASE_REGEX,
  SAY_THIS_REGEX,
  CAT_API_URI,
  CAT_GIF_API_URI,
  DOG_API_URI
} from './consts';

export default class ChatHandler {
  constructor() {
    this.apiBot = BotWrapperInstance.getBotApiInstance();
  }

  /**
   * Send a text message to a chat
   * @param {number} chatId
   * @param {string} content
   */
  sendMessage(chatId, content) {
    this.apiBot.sendMessage(chatId, content).catch(err => {
      console.error(err);
    });
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
    }
  }

  /**
   * Say something and spam admins when a new game is started
   * @param {number} chatId
   * @param {string} chatType
   */
  reactToNewGame(chatId, chatType) {
    if (chatType === 'group' || chatType === 'supergroup') {
      this.sendMessage(
        chatId,
        'Quereis empezar una partida? Eso merece un buen patataspam!'
      );
      this.sendAdminSpam(chatId, chatType);
    } else {
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
