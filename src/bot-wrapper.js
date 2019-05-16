import BotAPI from 'node-telegram-bot-api';

import { DbWrapperInstance, ChatHandlerInstance } from './instance-handler';

import { BOT_TOKEN } from './config';
import {
  NEW_PHRASE_REGEX,
  FORGET_PHRASE_REGEX,
  SEND_CAT_REGEX,
  SEND_DOG_REGEX,
  ADMIN_SPAM_REGEX,
  START_GAME_REGEX,
  SAY_THIS_REGEX,
  OLD_MESSAGES_THRESHOLD
} from './consts';

export default class BotWrapper {
  constructor() {
    this.apiBot = null;
    this.initBot();
  }

  /**
   * Set apiBot instance and request event handling
   */
  async initBot() {
    this.apiBot = new BotAPI(BOT_TOKEN, { polling: { autoStart: false } });
    await DbWrapperInstance.connectToMongoServer();

    this.setupEventListeners();
    this.apiBot.startPolling();
  }

  /**
   * Return telegram bot api instance
   */
  getBotApiInstance() {
    return this.apiBot;
  }

  /**
   * Assign message and polling_error event handlers
   */
  setupEventListeners() {
    this.apiBot.on('message', this.handleMessageEvent.bind(this));
    this.apiBot.on('polling_error', this.handlePollingErrorEvent);
  }

  /**
   * Determine if a message is older than current epoch time minus OLD_MESSAGES_THRESHOLD
   * @param {BotAPI.Message} messageEvent
   */
  isOldMessage(messageEvent) {
    const now = new Date().getTime();
    const messageDate = new Date(messageEvent.date * 1000);

    return now - OLD_MESSAGES_THRESHOLD * 1000 > messageDate.getTime();
  }

  /**
   * Handle message events
   * Determine how to interact with the message information
   * @param {BotAPI.Message} messageEvent
   */
  async handleMessageEvent(messageEvent) {
    const chatId = messageEvent.chat.id;
    const chatType = messageEvent.chat.type;
    const messageContent = messageEvent.text;
    const isOldMessage = this.isOldMessage(messageEvent);
    const isTextMessage = Boolean(messageContent);

    const messageTriggersNewPhrase = NEW_PHRASE_REGEX.test(messageContent);
    const messageTriggersForgetPhrase = FORGET_PHRASE_REGEX.test(
      messageContent
    );
    const messageTriggersAdminSpam = ADMIN_SPAM_REGEX.test(messageContent);
    const messageTriggersSendCat = SEND_CAT_REGEX.test(messageContent);
    const messageTriggersSendDog = SEND_DOG_REGEX.test(messageContent);
    const messageTriggersStartGame = START_GAME_REGEX.test(messageContent);
    const messageTriggersSayThis = SAY_THIS_REGEX.test(messageContent);

    if (!isTextMessage || isOldMessage) {
      console.info('Non-text or old message detected, skipping...');
      return;
    }

    if (messageTriggersForgetPhrase) {
      ChatHandlerInstance.deletePhrase(messageContent, chatId);
    } else if (messageTriggersNewPhrase) {
      ChatHandlerInstance.learnNewPhrase(messageContent, chatId);
    } else if (messageTriggersSendCat || messageTriggersSendDog) {
      messageTriggersSendCat
        ? ChatHandlerInstance.sendCatGif(chatId)
        : ChatHandlerInstance.sendDogGif(chatId);
    } else if (messageTriggersAdminSpam) {
      ChatHandlerInstance.sendAdminSpam(chatId, chatType);
    } else if (messageTriggersStartGame) {
      ChatHandlerInstance.reactToNewGame(chatId, chatType);
    } else if (messageTriggersSayThis) {
      ChatHandlerInstance.sayThis(chatId, messageContent);
    } else {
      ChatHandlerInstance.getAndSendKnownPhrase(messageContent, chatId);
    }
  }

  /**
   * Handle polling_error event
   * @param {Error} errorEvent
   */
  handlePollingErrorEvent(errorEvent) {
    console.error(errorEvent);
  }
}
