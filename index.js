// Importing necessary libraries
const config = require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const mongoose = require('mongoose');

const dns = require('dns');
const mongoose = require('mongoose');

// Basic Configurations
// Assign port if not set in env
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Wait for Mongo database to connect, logging an error if there is a problem
dbmain().catch((err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});




const listener = app.listen(port || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
