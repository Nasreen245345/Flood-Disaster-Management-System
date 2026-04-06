const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
    try {
        const { name, email, password, role, phone, region } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // CRITICAL: Prevent multiple admin accounts
        if (role === 'admin') {
            const adminExists = await User.findOne({ role: 'admin' });
            if (adminExists) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin account already exists. Only one admin is allowed in the system.'
                });
            }
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'victim',
            phone,
            region
        });

        // Auto-create Organization record if role is 'ngo'
        if (role === 'ngo') {
            const Organization = require('../models/Organization');
            
            try {
                await Organization.create({
                    name: name, // Use user's name as organization name initially
                    type: 'ngo',
                    contact: {
                        email: email,
                        phone: phone,
                        address: region || 'Not specified' // Use region as address or default
                    },
                    adminUser: user._id,
                    
                    // Operational Limits (defaults)
                    operationalLimit: {
                        maxDailyDistributions: 1000,
                        maxConcurrentRegions: 5
                    },
                    
                    // Service Rate Configuration (defaults)
                    serviceRateConfig: {
                        defaultRate: 20,
                        categoryRates: {
                            medical: 40,
                            food_distribution: 25,
                            shelter_management: 15,
                            logistics: 30,
                            general_support: 20
                        }
                    },
                    
                    // Inventory (empty initially)
                    inventory: [],
                    
                    // Active operations
                    activeDistributions: 0,
                    assignedRegions: [],
                    
                    // Status
                    status: 'pending', // Requires admin approval
                    verificationStatus: 'unverified',
                    
                    // Registration details (optional, can be filled later)
                    registrationNumber: '', // Can be assigned by admin
                    documents: [],
                    description: `${name} - Disaster relief organization` // Auto-generated description
                });
                
                console.log(`✅ Auto-created Organization for NGO user: ${name}`);
            } catch (orgError) {
                console.error('Error creating organization:', orgError);
                // Don't fail the signup if organization creation fails
                // Admin can manually create it later
            }
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                region: user.region
            }
        });
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is blocked
        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact support.'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last active
        user.lastActive = Date.now();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Prepare user response
        const userResponse = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            region: user.region,
            status: user.status
        };

        // If user is a volunteer, fetch and include volunteer ID
        if (user.role === 'volunteer') {
            const Volunteer = require('../models/Volunteer');
            const volunteer = await Volunteer.findOne({ userId: user._id });
            if (volunteer) {
                userResponse.volunteerId = volunteer._id;
            }
        }

        // If user is NGO, fetch and include organization ID
        if (user.role === 'ngo') {
            const Organization = require('../models/Organization');
            const organization = await Organization.findOne({ adminUser: user._id });
            if (organization) {
                userResponse.organizationId = organization._id;
            }
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: userResponse
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// @desc    Login with CNIC (for victims who submitted without account)
// @route   POST /api/auth/cnic-login
// @access  Public
exports.cnicLogin = async (req, res) => {
    try {
        const { cnic, phone } = req.body;

        if (!cnic || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Please provide CNIC and phone number'
            });
        }

        // Normalize CNIC - strip dashes and spaces
        const normalizedCNIC = cnic.replace(/[-\s]/g, '');

        // Find user by CNIC
        const user = await User.findOne({ cnic: normalizedCNIC, role: 'victim' }).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with this CNIC. Please submit an aid request first.'
            });
        }

        // Verify phone matches
        if (user.phone !== phone.trim()) {
            return res.status(401).json({
                success: false,
                message: 'Phone number does not match our records'
            });
        }

        if (user.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact support.'
            });
        }

        user.lastActive = Date.now();
        await user.save();

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                cnic: user.cnic,
                region: user.region
            }
        });
    } catch (error) {
        console.error('CNIC Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get Me Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
};
