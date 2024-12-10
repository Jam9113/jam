
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware setup
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/Thrift', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// User schema and model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Handle user signup
app.post('/signup', async (req, res) => {
    try {
        const { username, firstName, lastName, email, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });
        await newUser.save();
        res.status(201).json({
            message: 'User Registered Successfully!',
            redirectTo: '/login.html'  // Redirect to login page
        });
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Handle user login
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        res.status(200).json({ message: 'Login successful!', redirectTo: '/weeb.html' });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.get('/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

app.put('/user/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Hash the password if it is updated
        let updatedData = { firstName, lastName, email };
        if (password) {
            updatedData.password = await bcrypt.hash(password, 10);
        }

        const user = await User.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully!', user });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// **Delete**: Delete user by ID
app.delete('/user/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully!' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://127.0.0.1:${PORT}`);
});
