
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

// Exercise Schema
const exerciseSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
  }]
});

// Create Model of Exercise Schema and asign to variable
let Exercise = mongoose.model('Excersize', exerciseSchema);

// Function to create a new user
const createAndSavePerson = async (name) => {
  try {
    let exerciseSchema = new Exercise({
      username: name
    });
    await exerciseSchema.save();
    // return user and id
  } catch (err) {
    console.log(err);
  }
};

// Get User from database by name
const getUser = async (name) => {
  try {
    const query = Exercise.find({ username: name });
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

// Save Exercise to the database if a User enty exist
app.post('/api/users/:_id/exercises', async function(req, res) {

  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    // Validate user input
    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required.' });
    }

    // Check if the user exists
    const user = await User.findById(userId);  
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Create the exercise
    const exercise = new Exercise({
      userId: userId,
      description: description,
      duration: duration,
      date: date ? new Date(date) : new Date()
    });

    // Save the exercise to the database
    await exercise.save();

    // Return the response
    res.status(201).json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id
    });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while saving the exercise.' });
  }
})


// general functions
async function dbmain() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to the database');
  } catch (err) { 
    throw new Error('Failed to connect to the database: ' + err.message);
  }
}