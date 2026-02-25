const AidRequest = require('../models/AidRequest');
const Organization = require('../models/Organization');
const RegionAssignment = require('../models/RegionAssignment');

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}

// Helper function to parse location string to coordinates
function parseLocation(locationString) {
    if (!locationString) return null;
    
    // Expected format: "latitude, longitude"
    const parts = locationString.split(',').map(p => p.trim());
    if (parts.length !== 2) return null;
    
    const lat = parseFloat(parts[0]);
    const lon = parseFloat(parts[1]);
    
    if (isNaN(lat) || isNaN(lon)) return null;
    
    return { latitude: lat, longitude: lon };
}

// Helper function to find best NGO for aid request
async function findBestNGO(aidRequest) {
    try {
        console.log('🔍 Finding best NGO for aid request...');
        
        // Parse victim's location
        const victimCoords = parseLocation(aidRequest.location);
        if (!victimCoords) {
            console.log('⚠️  Could not parse victim location');
            return null;
        }
        
        console.log('📍 Victim location:', victimCoords);
        
        // Get all approved NGOs
        const ngos = await Organization.find({ 
            status: 'approved',
            verificationStatus: 'verified'
        });
        
        console.log(`📊 Found ${ngos.length} approved NGOs`);
        
        if (ngos.length === 0) {
            console.log('⚠️  No approved NGOs available');
            return null;
        }
        
        // Get all active region assignments
        const assignments = await RegionAssignment.find({ 
            status: { $in: ['assigned', 'in-progress'] }
        }).populate('assignedNGOs');
        
        console.log(`📋 Found ${assignments.length} active region assignments`);
        
        // Score each NGO based on multiple factors
        const ngoScores = [];
        
        for (const ngo of ngos) {
            let score = 0;
            let reasons = [];
            
            // Factor 1: Check if NGO is assigned to nearby regions (proximity)
            let isNearby = false;
            let minDistance = Infinity;
            
            for (const assignment of assignments) {
                if (assignment.assignedNGOs.some(n => n._id.toString() === ngo._id.toString())) {
                    // NGO is assigned to this region
                    // For simplicity, we'll consider region name matching or proximity
                    // In a real system, regions would have coordinates
                    isNearby = true;
                    reasons.push(`Assigned to region: ${assignment.region}`);
                    score += 30; // High score for being assigned to a region
                }
            }
            
            // Factor 2: Check NGO capacity
            const capacity = await ngo.calculateEffectiveCapacity();
            const availableCapacity = capacity.effectiveCapacity - ngo.activeDistributions;
            
            console.log(`NGO: ${ngo.name}, Capacity: ${capacity.effectiveCapacity}, Active: ${ngo.activeDistributions}, Available: ${availableCapacity}`);
            
            if (availableCapacity >= aidRequest.peopleCount) {
                score += 40; // High score for having enough capacity
                reasons.push(`Has capacity for ${aidRequest.peopleCount} people`);
            } else if (availableCapacity > 0) {
                score += 20; // Partial score for some capacity
                reasons.push(`Partial capacity: ${availableCapacity} people`);
            } else {
                reasons.push('No available capacity');
            }
            
            // Factor 3: Check inventory for required packages
            let hasRequiredItems = true;
            if (aidRequest.packagesNeeded && aidRequest.packagesNeeded.length > 0) {
                for (const needed of aidRequest.packagesNeeded) {
                    const inventoryItem = ngo.inventory.find(
                        item => item.category === needed.category && 
                                item.quantity >= needed.quantity
                    );
                    
                    if (inventoryItem) {
                        score += 10; // Score for having required items
                        reasons.push(`Has ${needed.category} packages`);
                    } else {
                        hasRequiredItems = false;
                        reasons.push(`Missing ${needed.category} packages`);
                    }
                }
            }
            
            // Factor 4: Workload (prefer less busy NGOs)
            const workload = await ngo.calculateWorkload();
            if (workload < 50) {
                score += 15; // Good availability
                reasons.push(`Low workload: ${workload}%`);
            } else if (workload < 80) {
                score += 5; // Moderate availability
                reasons.push(`Moderate workload: ${workload}%`);
            } else {
                reasons.push(`High workload: ${workload}%`);
            }
            
            // Factor 5: Number of concurrent regions (prefer NGOs with capacity for more regions)
            const currentRegions = ngo.assignedRegions.length;
            const maxRegions = ngo.operationalLimit.maxConcurrentRegions;
            if (currentRegions < maxRegions) {
                score += 5;
                reasons.push(`Can handle more regions: ${currentRegions}/${maxRegions}`);
            }
            
            ngoScores.push({
                ngo,
                score,
                reasons,
                availableCapacity,
                workload
            });
        }
        
        // Sort by score (highest first)
        ngoScores.sort((a, b) => b.score - a.score);
        
        console.log('📊 NGO Scores:');
        ngoScores.forEach(item => {
            console.log(`  ${item.ngo.name}: ${item.score} points`);
            item.reasons.forEach(reason => console.log(`    - ${reason}`));
        });
        
        // Return the best NGO (highest score)
        if (ngoScores.length > 0 && ngoScores[0].score > 0) {
            console.log(`✅ Best NGO: ${ngoScores[0].ngo.name} (${ngoScores[0].score} points)`);
            return ngoScores[0].ngo;
        }
        
        console.log('⚠️  No suitable NGO found');
        return null;
        
    } catch (error) {
        console.error('Error finding best NGO:', error);
        return null;
    }
}

// @desc    Create new aid request with intelligent NGO assignment
// @route   POST /api/aid-requests
// @access  Private
exports.createRequest = async (req, res) => {
    try {
        console.log('=== CREATE AID REQUEST ===');
        console.log('Request Body:', JSON.stringify(req.body, null, 2));
        console.log('User ID:', req.user?.id);

        // Add user to req.body
        req.body.requester = req.user.id;
        
        // Parse and store coordinates
        const coords = parseLocation(req.body.location);
        if (coords) {
            req.body.coordinates = coords;
            console.log('📍 Parsed coordinates:', coords);
        }

        // Find best NGO for this request
        const bestNGO = await findBestNGO(req.body);
        
        if (bestNGO) {
            req.body.assignedNGO = bestNGO._id;
            req.body.status = 'approved'; // Auto-approve if NGO found
            console.log(`✅ Auto-assigned to NGO: ${bestNGO.name}`);
        } else {
            req.body.status = 'pending'; // Keep pending if no NGO found
            console.log('⚠️  No NGO assigned - request will be pending');
        }

        console.log('Final payload before save:', JSON.stringify(req.body, null, 2));

        const aidRequest = await AidRequest.create(req.body);

        console.log('✅ Aid Request Created Successfully:', aidRequest._id);

        // Populate the assigned NGO for response
        await aidRequest.populate('assignedNGO', 'name contact');

        res.status(201).json({
            success: true,
            data: aidRequest,
            message: bestNGO 
                ? `Request auto-assigned to ${bestNGO.name}` 
                : 'Request created - awaiting manual assignment'
        });
    } catch (error) {
        console.error('❌ Create Request Error:', error);
        console.error('Error Details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error creating aid request',
            error: error.message
        });
    }
};

// @desc    Get all aid requests
// @route   GET /api/aid-requests
// @access  Private
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await AidRequest.find()
            .populate('requester', 'name email phone')
            .populate('assignedNGO', 'name contact')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get All Requests Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching aid requests',
            error: error.message
        });
    }
};

// @desc    Get aid requests for specific NGO
// @route   GET /api/aid-requests/ngo/:ngoId
// @access  Private (NGO or Admin)
exports.getNGORequests = async (req, res) => {
    try {
        const requests = await AidRequest.find({ assignedNGO: req.params.ngoId })
            .populate('requester', 'name email phone')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get NGO Requests Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching NGO requests',
            error: error.message
        });
    }
};

// @desc    Get logged in user's requests
// @route   GET /api/aid-requests/my-requests
// @access  Private
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await AidRequest.find({ requester: req.user.id });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get My Requests Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user requests',
            error: error.message
        });
    }
};

// @desc    Get single request
// @route   GET /api/aid-requests/:id
// @access  Private
exports.getRequestById = async (req, res) => {
    try {
        const request = await AidRequest.findById(req.params.id).populate('requester', 'name email phone');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Aid request not found'
            });
        }

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Get Request Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching request details',
            error: error.message
        });
    }
};

// @desc    Update request status
// @route   PUT /api/aid-requests/:id/status
// @access  Private (Admin/NGO only - strictly speaking, but for now we'll allow generic update logic or refine roles later)
exports.updateRequestStatus = async (req, res) => {
    try {
        let request = await AidRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Aid request not found'
            });
        }

        // TODO: Add role check here (e.g., only Admin/NGO can approve)
        // For now, allowing update for simplicity of testing, or restricted to non-requesters?
        // Let's assume the frontend handles the UI restriction, and backend just validates existence.
        // In a real app, strict Role Based Access Control (RBAC) is needed.

        request = await AidRequest.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Update Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating request status',
            error: error.message
        });
    }
};

// @desc    Delete request
// @route   DELETE /api/aid-requests/:id
// @access  Private
exports.deleteRequest = async (req, res) => {
    try {
        const request = await AidRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Aid request not found'
            });
        }

        // Make sure user is request owner or admin
        if (request.requester.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to delete this request'
            });
        }

        await request.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Delete Request Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting request',
            error: error.message
        });
    }
};
