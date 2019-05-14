import { DbWrapperInstance } from './instance-handler';

import { NEW_PHRASE_REGEX } from './consts';

export default class PhrasesManager {
  /**
   * Search for a stored triggers contained in the provided string
   * @param {string} messageContent
   */
  async searchMatchingResponses(messageContent) {
    const phrases = await DbWrapperInstance.getAllFromCollection('phrases');

    return phrases
      .filter(result => messageContent.includes(result.trigger))
      .map(phrase => phrase.response);
  }

  /**
   * Search responses matching certain trigger
   * @param {string} triggerString
   */
  async getTriggerMatchingPhrases(triggerString) {
    const phrases = await DbWrapperInstance.getFromCollection('phrases', {
      trigger: { $eq: triggerString }
    });

    return phrases.map(phrase => {
      return { trigger: phrase.trigger, response: phrase.response };
    });
  }

  /**
   * Parse message and store the new phrase key pair
   * @param {string} messageContent
   */
  async learnNewPhrase(messageContent) {
    let learningResult = 'Aprendido!';
    const parsedContent = NEW_PHRASE_REGEX.exec(messageContent);
    const trigger = parsedContent.groups.trigger.toLowerCase();
    const response = parsedContent.groups.response;

    const triggerIsTooShort = trigger.length < 3;
    const responseIsEmpty = !response.trim();
    const phraseAlreadyExists = await this.checkPhraseExistance({
      trigger,
      response
    });

    if (phraseAlreadyExists || triggerIsTooShort || responseIsEmpty) {
      if (phraseAlreadyExists) {
        learningResult =
          'Ya conozco esa frase en toda su exactitud, cacho monger!';
      } else if (triggerIsTooShort) {
        learningResult = 'Esa frase es muy corta, gilipollas.';
      } else if (responseIsEmpty)
        learningResult =
          'Por lo menos ten la decencia de especificar una respuesta, no?'; // This never triggers because the text won't pass the regex test
    } else {
      await DbWrapperInstance.insertToCollection('phrases', {
        trigger,
        response
      }).catch(err => {
        console.error(err);
        learningResult = 'No he podido aprender eso...';
      });
    }

    return learningResult;
  }

  /**
   * Delete the specified phrase key pair from the database
   * @param {object} phraseKeyPair
   */
  async removePhrase(phraseKeyPair) {
    let deletionResult = false;
    const mongoPhraseQuery = {
      trigger: { $eq: phraseKeyPair.trigger },
      response: { $eq: phraseKeyPair.response }
    };

    deletionResult = await DbWrapperInstance.deleteFromCollection(
      'phrases',
      mongoPhraseQuery
    );

    return deletionResult.result.ok;
  }

  /**
   * Determine if the provided phrase key pair already exists
   * @param {object} phraseKeyPair
   */
  async checkPhraseExistance(phraseKeyPair) {
    let result = null;
    const mongoPhraseQuery = {
      trigger: { $eq: phraseKeyPair.trigger },
      response: { $eq: phraseKeyPair.response }
    };

    const foundItems = await DbWrapperInstance.getFromCollection(
      'phrases',
      mongoPhraseQuery
    );

    if (foundItems.length > 0) {
      result = foundItems[0];
    }

    return result;
  }

  /**
   * Get stored response that matchies the specified trigger
   * If there are multiple options, a random one is selected
   * @param {string} messageContent
   */
  async getRandomMatchingPhrase(messageContent) {
    const possibleResponses = await this.searchMatchingResponses(
      messageContent
    );
    let selectedPhrase = null;

    if (possibleResponses.length > 0) {
      selectedPhrase =
        possibleResponses[Math.floor(Math.random() * possibleResponses.length)];
    }

    return selectedPhrase;
  }
}
