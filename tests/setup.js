jest.setTimeout(30000); // set enough time for individual jest testing

// Global Jest setup to connect mongoDB for testing environment
require('../models/User');

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true });
