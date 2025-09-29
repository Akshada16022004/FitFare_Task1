const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', {
        expiresIn: '7d'
    });
};

exports.register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        user = new User({ name, email, password });
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                membership: user.membership
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                membership: user.membership
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const User = require('../models/User');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, email, membership } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email, membership },
            { new: true, runValidators: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        // For now, we'll use a simple URL-based avatar
        // In production, you'd want to handle file uploads properly
        const { avatarUrl } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { avatar: avatarUrl },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const QRCode = require('qrcode');
const User = require('../models/User');

exports.generateQR = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        const userData = {
            userId: user._id,
            name: user.name,
            email: user.email,
            membership: user.membership,
            profileUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/user/${user._id}`,
            generatedAt: new Date().toISOString()
        };

        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(userData));
        
        // Save QR code data to user
        user.qrCodeData = qrCodeDataUrl;
        await user.save();

        res.json({
            qrCode: qrCodeDataUrl,
            userData: userData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating QR code' });
    }
};

exports.getUserQR = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('name email membership avatar');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = { 
            name: user.name, 
            email: user.email,
            membership: user.membership
        };
        
        const qrCode = await QRCode.toDataURL(JSON.stringify(userData));
        
        res.json({ 
            qrCode, 
            user: userData,
            avatar: user.avatar
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating QR code' });
    }
};