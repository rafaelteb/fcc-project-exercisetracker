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
      duration: parseInt(duration),
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

// get all users
app.get('/api/users', async (req, res) => {
    try {
      const allUsers = await Exercise.find({}, {username: 1, _id: 1} );
      
      if (!allUsers) {
        return res.status(404).json({ error: 'No Users found.' });
      }
      return res.json(allUsers);
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while getting the list of all users');
    }
})

// Get exercise logs
app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const userId = req.params._id;
    const { from, to, limit } = req.query;
    
    // Find the user
    const user = await Exercise.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Parse query parameters
    let fromDate = from ? new Date(from) : new Date(0); // Default to epoch start if 'from' is not provided
    let toDate = to ? new Date(to) : new Date(); // Default to current date if 'to' is not provided
    let logLimit = limit ? parseInt(limit) : null;

    // Validate date parsing
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format.' });
    }

    // Filter logs by date range
    let filteredLogs = user.log.filter(log => {
      let logDate = new Date(log.date);
      return logDate >= fromDate && logDate <= toDate;
    });

    // Apply limit if specified
    if (logLimit) {
      filteredLogs = filteredLogs.slice(0, logLimit);
    }

    // Format the response
    const response = {
      username: user.username,
      count: filteredLogs.length,
      _id: user._id,
      log: filteredLogs.map(log => ({
        description: log.description,
        duration: log.duration,
        date: log.date.toDateString()
      }))
    };

    res.json(response);

  } catch (error) {
    console.error(err);
    res.status(500).send('An error occurred while getting the logs');
  }  
})