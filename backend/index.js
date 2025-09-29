const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database
let users = [];
let nextId = 1;

// Simple auth middleware (defined inline)
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, 'your-secret-key');
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running perfectly!',
        usersCount: users.length,
        timestamp: new Date().toISOString()
    });
});

// Register user
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log('Registration attempt:', { name, email });

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required' 
            });
        }

        // Check if user exists
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = {
            id: nextId++,
            name,
            email,
            password: hashedPassword,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=007bff`,
            membership: 'Basic',
            createdAt: new Date()
        };

        users.push(user);
        console.log('User registered successfully:', user.email);

        // Generate token
        const token = jwt.sign({ id: user.id }, 'your-secret-key', { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                membership: user.membership
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration' 
        });
    }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', { email });

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required' 
            });
        }

        // Find user
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Generate token
        const token = jwt.sign({ id: user.id }, 'your-secret-key', { expiresIn: '7d' });

        console.log('User logged in successfully:', user.email);

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                membership: user.membership
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login' 
        });
    }
});

// Get current user profile (protected)
app.get('/api/users/profile', auth, (req, res) => {
    try {
        const user = users.find(user => user.id === req.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                membership: user.membership,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// Update user profile (protected)
app.put('/api/users/profile', auth, (req, res) => {
    try {
        const { name, email, membership } = req.body;
        const user = users.find(user => user.id === req.userId);

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Validation
        if (!name || !email) {
            return res.status(400).json({ 
                success: false,
                message: 'Name and email are required' 
            });
        }

        // Check if email is taken by another user
        const emailExists = users.find(u => u.email === email && u.id !== req.userId);
        if (emailExists) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }

        // Update user
        user.name = name;
        user.email = email;
        user.membership = membership || 'Basic';
        user.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=007bff`;

        console.log('Profile updated for user:', user.email);

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                membership: user.membership
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// Generate QR code (protected)
app.post('/api/qrcode/generate', auth, async (req, res) => {
    try {
        const user = users.find(user => user.id === req.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const userData = {
            userId: user.id,
            name: user.name,
            email: user.email,
            membership: user.membership,
            profileUrl: `http://localhost:3000/user/${user.id}`,
            generatedAt: new Date().toISOString()
        };

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(userData));

        console.log('QR code generated for user:', user.email);

        res.json({
            success: true,
            qrCode: qrCodeDataUrl,
            userData: userData
        });
    } catch (error) {
        console.error('QR code generation error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error generating QR code' 
        });
    }
});

// Get user QR code by user ID (public)
app.get('/api/qrcode/user/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const userData = {
            name: user.name,
            email: user.email,
            membership: user.membership
        };

        // Generate QR code
        const qrCode = await QRCode.toDataURL(JSON.stringify(userData));

        res.json({
            success: true,
            qrCode: qrCode,
            user: userData,
            avatar: user.avatar
        });
    } catch (error) {
        console.error('Get user QR error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error generating QR code' 
        });
    }
});

// Get all users (for testing only)
app.get('/api/users', (req, res) => {
    res.json({
        success: true,
        users: users.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            membership: user.membership
        }))
    });
});

// Test endpoint to add sample user
app.post('/api/test/user', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash('password123', 12);
        const user = {
            id: nextId++,
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword,
            avatar: 'https://ui-avatars.com/api/?name=Test+User&background=007bff',
            membership: 'Premium',
            createdAt: new Date()
        };

        users.push(user);

        res.json({
            success: true,
            message: 'Test user created',
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error creating test user' 
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('✨ ======================================== ✨');
    console.log('🚀 User Dashboard Backend Server Started!');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log('✨ ======================================== ✨');
    console.log('');
    console.log('📋 Available API Endpoints:');
    console.log('   GET    /api/health            - Health check');
    console.log('   POST   /api/auth/register     - Register new user');
    console.log('   POST   /api/auth/login        - Login user');
    console.log('   GET    /api/users/profile     - Get user profile (Protected)');
    console.log('   PUT    /api/users/profile     - Update profile (Protected)');
    console.log('   POST   /api/qrcode/generate   - Generate QR code (Protected)');
    console.log('   GET    /api/qrcode/user/:id   - Get user QR code');
    console.log('   GET    /api/users             - Get all users (Testing)');
    console.log('   POST   /api/test/user         - Create test user');
    console.log('');
    console.log('🔒 Protected routes require Authorization header:');
    console.log('   Authorization: Bearer <token>');
    console.log('✨ ======================================== ✨');
});