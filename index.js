
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


// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  } // note: _id field is created automatically  
});

// Create Model of User Schema and asign to variable
let User = mongoose.model('User', userSchema);

// Function to create a new user
const createAndSavePerson = async (name) => {
  try {
    let userInstance = new User({
      name: name
    });
    await userInstance.save();
    // return user and id
  } catch (err) {
    console.log(err);
  }
};

// Get User from database by name
const getUser = async (name) => {
  try {
    const query = User.find({ name: name });
    return await query.exec();
  } catch (err) {
    console.log(err);
  }
}

// Save Users to the database and return the saved user to the screen
app.post('/api/users', async function(req, res) {
  try {
    const username = req.body.username;
    await createAndSavePerson(username);
    let savedUser = await getUser(username);
    res.send(savedUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while creating the user');
}});


// general functions
async function dbmain() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to the database');
  } catch (err) { 
    throw new Error('Failed to connect to the database: ' + err.message);
  }
}