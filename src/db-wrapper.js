import { MongoClient } from 'mongodb';

import { MONGO_CONNECTION_STRING } from './config';

export default class DbWrapper {
  constructor() {
    this.db = null;
  }

  async connectToMongoServer() {
    const mongoClient = new MongoClient(MONGO_CONNECTION_STRING);

    const connectionResult = await mongoClient.connect().catch(err => {
      console.error(err);
    });

    this.db = await connectionResult.db();

    console.info('\nConnected successfully to mongodb server.');
  }

  /**
   * Get a collection object from the db instance
   * @param {string} collectionName
   */
  getCollection(collectionName) {
    return this.db.collection(collectionName);
  }

  /**
   * Insert a new document to the specified collection
   * @param {string} collectionName
   * @param {object} data
   */
  insertToCollection(collectionName, data = {}) {
    const collectionObject = this.getCollection(collectionName);
    return collectionObject.insertOne(data);
  }

  /**
   * Get all documents from the specified collection
   * @param {string} collectionName
   */
  getAllFromCollection(collectionName) {
    const collectionObject = this.getCollection(collectionName);
    return collectionObject.find().toArray();
  }

  /**
   * Get a document from the specified collection that matches the provided mongodb query
   * @param {string} collectionName
   * @param {object} mongoDbQueryFilter
   */
  getFromCollection(collectionName, mongoDbQueryFilter) {
    const collectionObject = this.getCollection(collectionName);
    return collectionObject.find(mongoDbQueryFilter).toArray();
  }

  /**
   * Delete a document from the specified collection that matches the provided mongodb query
   * @param {string} collectionName
   * @param {object} mongoDbQueryFilter
   */
  deleteFromCollection(collectionName, mongoDbQueryFilter) {
    const collectionObject = this.getCollection(collectionName);
    return collectionObject.deleteOne(mongoDbQueryFilter);
  }
}
