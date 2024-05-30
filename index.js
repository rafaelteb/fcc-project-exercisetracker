
// Importing necessary libraries
const config = require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

// Basic Configurations
// Assign port if not set in env
const port = process.env.PORT || 3000;
// Middleware handle url encoded data
app.use(bodyParser.urlencoded({extended: false}))
// Corse settings activate
app.use(cors());
// Set app port listner
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// Wait for Mongo database to connect, logging an error if there is a problem
dbmain().catch((err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// First routes
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

async function dbmain() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to the database');
  } catch (err) { 
    throw new Error('Failed to connect to the database: ' + err.message);
  }
}