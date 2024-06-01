// Importing necessary libraries
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Basic Configurations
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to the database');
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}
connectToDatabase();

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// Serve static files
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Exercise Schema and Model
const exerciseSchema = new mongoose.Schema({
  username: { type: String, required: true },
  count: { type: Number, default: 0 },
  log: [
    {
      description: { type: String, required: true },
      duration: { type: Number, required: true },
      date: { type: Date, default: Date.now },
    },
  ],
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

// Function to create a new user
const createAndSaveUser = async (username) => {
  try {
    const newUser = new Exercise({ username });
    return await newUser.save();
  } catch (err) {
    throw new Error('Error creating user: ' + err.message);
  }
};

// Get User from database by name
const getUserByUsername = async (username) => {
  try {
    return await Exercise.findOne({ username });
  } catch (err) {
    throw new Error('Error fetching user: ' + err.message);
  }
};

// Create a new user endpoint
app.post('/api/users', async (req, res) => {
  try {
    const username = req.body.username;
    const newUser = await createAndSaveUser(username);
    res.json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while creating the user');
  }
});

// Save Exercise to the database if a User entry exists
app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    // Validate user input
    if (!description || !duration) {
      return res.status(400).json({ error: 'Description and duration are required.' });
    }

    // Check if the user exists
    const user = await Exercise.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Create the exercise
    const exercise = {
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    };

    // Update user log
    user.log.push(exercise);
    user.count = user.log.length;
    await user.save();

    // Return the response
    res.status(201).json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving the exercise.' });
  }
});
