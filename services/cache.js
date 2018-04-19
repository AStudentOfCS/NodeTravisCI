const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

// const redisUrl = 'redis://127.0.0.1:6379';
// const client = redis.createClient(redisUrl);
/**
 * Update redis URL for Travis-CI server
 */
const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget); // nested database structure cache with Redis Hashes

// PROBLEM -1- resolving
const exec = mongoose.Query.prototype.exec;

// Toggable cache
mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;

  // nested database structure cache with Redis Hashes
  this.hashKey = JSON.stringify(options.key || '');

  return this;
};

// Using 'function' keyword make 'this' refer to Query.prototype.exec
// Not using () => {}
mongoose.Query.prototype.exec = async function() {
  // modified Query prototype
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  // PROBLEM -3- resolving
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    })
  );

  // See if we have a value for 'key' in redis
  const cacheValue = await client.hget(this.hashKey, key); // nested database structure cache with Redis Hashes

  // If YES, return that
  if (cacheValue) {
    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map(d => new this.model(d)) // Hydrating array
      : new this.model(doc); // Hydrating model
  }

  // If NO, issue the modified query and store the result in redis
  const result = await exec.apply(this, arguments);

  // exec function returns Mongoose Documents
  // Redis handles JSON
  client.hset(this.hashKey, key, JSON.stringify(result)); // nested database structure cache with Redis Hashes

  return result;
};

// Clear data cache function
module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  }
};
