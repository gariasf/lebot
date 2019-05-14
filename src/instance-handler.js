// Because who wants dependency injection anyway?
import DbWrapper from './db-wrapper';
import BotWrapper from './bot-wrapper';
import ChatHandler from './chat-handler';
import PhrasesHandler from './phrases-handler';

let DbWrapperInstance = null;
let BotWrapperInstance = null;
let ChatHandlerInstance = null;
let PhrasesHandlerInstance = null;

export function initInstances() {
  DbWrapperInstance = new DbWrapper();
  BotWrapperInstance = new BotWrapper();
  ChatHandlerInstance = new ChatHandler();
  PhrasesHandlerInstance = new PhrasesHandler();
}

export {
  DbWrapperInstance,
  BotWrapperInstance,
  ChatHandlerInstance,
  PhrasesHandlerInstance
};
