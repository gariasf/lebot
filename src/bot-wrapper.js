import BotAPI from 'node-telegram-bot-api';

import { DbWrapperInstance, ChatHandlerInstance } from './instance-handler';

import { BOT_TOKEN } from './config';
import {
  NEW_PHRASE_REGEX,
  FORGET_PHRASE_REGEX,
  SEND_MEDIA_REGEX,
  ADMIN_SPAM_REGEX,
  START_GAME_REGEX,
  SAY_THIS_REGEX,
  SHUT_UP_REGEX,
  BOT_CAN_TALK_REGEX,
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
    this.apiBot.on('callback_query', this.handleCallbackQueryEvent.bind(this));
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
    let messageContent = messageEvent.text;
    const chatId = messageEvent.chat.id;
    const chatType = messageEvent.chat.type;
    const isOldMessage = this.isOldMessage(messageEvent);
    const isTextMessage = Boolean(messageEvent.text);

    const messageTriggersNewPhrase = NEW_PHRASE_REGEX.test(messageContent);
    const messageTriggersForgetPhrase = FORGET_PHRASE_REGEX.test(
      messageContent
    );
    const messageTriggersAdminSpam = ADMIN_SPAM_REGEX.test(messageContent);
    const messageTriggersSendMedia = SEND_MEDIA_REGEX.test(messageContent);
    const messageTriggersStartGame = START_GAME_REGEX.test(messageContent);
    const messageTriggersSayThis = SAY_THIS_REGEX.test(messageContent);
    const messageTrigersShupUp = SHUT_UP_REGEX.test(messageContent);
    const messageTriggersDisableShutup = BOT_CAN_TALK_REGEX.test(
      messageContent
    );

    if (chatType !== 'private') {
      ChatHandlerInstance.scheduleT3T3(chatId);
    }

    if (!isTextMessage || isOldMessage) {
      console.info('Non-text or old message detected, skipping...');
      return;
    }

    messageContent = messageContent.toLowerCase();

    if (messageTrigersShupUp) {
      ChatHandlerInstance.shutUp(messageContent, chatId);
    } else if (messageTriggersDisableShutup) {
      ChatHandlerInstance.disableShutUp(chatId);
    } else if (messageTriggersForgetPhrase) {
      ChatHandlerInstance.deletePhrase(messageContent, chatId, chatType);
    } else if (messageTriggersNewPhrase) {
      ChatHandlerInstance.learnNewPhrase(messageContent, chatId, chatType);
    } else if (messageTriggersSendMedia) {
      ChatHandlerInstance.sendMedia(chatId, messageContent);
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

  handleCallbackQueryEvent(callbackQueryEvent) {
    const eventData = JSON.parse(callbackQueryEvent.data);
    const eventOriginatorMessage = callbackQueryEvent.message;
    const chatId = callbackQueryEvent.message.chat.id;
    const callbackId = callbackQueryEvent.id;

    if (eventData.command == 'deletePhrase') {
      ChatHandlerInstance.fromCallbackDeletePhrase(
        chatId,
        callbackId,
        eventOriginatorMessage.message_id,
        eventOriginatorMessage.text,
        Number(eventData.phraseIndexInarray)
      );
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
