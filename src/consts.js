export const NEW_PHRASE_REGEX = /(trufa|amigo) aprende a contestar "(?<response>.+)" cuando digan "(?<trigger>.+)"/i;
export const FORGET_PHRASE_REGEX = /(trufa|amigo) olvidate de "(?<trigger>.+)"/i;
export const SEND_CAT_REGEX = /(trufa|amigo) dame un gato/i;
export const SEND_DOG_REGEX = /(trufa|amigo) dame un perro/i;
export const ADMIN_SPAM_REGEX = /patataspa|(trufa|amigo) spam(ea)? a to dios/i;
export const START_GAME_REGEX = /^\/start.+/i;
export const SAY_THIS_REGEX = /(trufa|amigo) di "(?<whattosay>.+)"/i;
export const SHUT_UP_REGEX = /(trufa|amigo) (callate|cierra el pico|callate la boca|shut( the)?( fuck?) up|stfu)( (por|durante|for|x) (?<interval>\d+))?/i; // Interval is in minutes
export const BOT_CAN_TALK_REGEX = /(trufa|amigo) (ya puedes hablar|descallate|desmuteate)/i;

export const OLD_MESSAGES_THRESHOLD = 60; // In seconds
export const DEFAULT_SHUTUP_INTERVAL = 1; // In minutes

export const DOG_API_URI = 'https://dog.ceo/api/breeds/image/random';
export const CAT_API_URI = 'https://api.thecatapi.com/v1/images/search';
export const CAT_GIF_API_URI =
  'https://api.thecatapi.com/v1/images/search?mime_types=gif';
