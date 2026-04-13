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
// Criteria: 1) Nearest active disaster to victim  2) NGO assigned to that disaster  3) Has capacity
async function findBestNGO(aidRequest) {
    try {
        console.log('🔍 Finding best NGO for aid request...');

        const victimCoords = parseLocation(aidRequest.location);
        if (!victimCoords) {
            console.log('⚠️  Could not parse victim location');
            return null;
        }

        console.log('📍 Victim location:', victimCoords);

        const Disaster = require('../models/Disaster');

        // Step 1: Find nearest active disaster to victim
        const activeDiasters = await Disaster.find({
            status: { $in: ['active', 'verified'] },
            'coordinates.latitude': { $exists: true },
            'coordinates.longitude': { $exists: true }
        });

        if (activeDiasters.length === 0) {
            console.log('⚠️  No active disasters with coordinates found');
            return null;
        }

        // Sort disasters by distance to victim
        const disastersWithDistance = activeDiasters.map(d => ({
            disaster: d,
            distance: calculateDistance(
                victimCoords.latitude, victimCoords.longitude,
                d.coordinates.latitude, d.coordinates.longitude
            )
        })).sort((a, b) => a.distance - b.distance);

        console.log('📊 Nearest disasters:');
        disastersWithDistance.slice(0, 3).forEach(d =>
            console.log(`  - ${d.disaster.disasterType} at ${d.disaster.location}: ${d.distance.toFixed(1)}km`)
        );

        // Step 2: Find NGOs assigned to the nearest disasters (within 200km)
        const nearbyDisasterIds = disastersWithDistance
            .filter(d => d.distance <= 200)
            .map(d => d.disaster._id);

        if (nearbyDisasterIds.length === 0) {
            console.log('⚠️  No disasters within 200km of victim');
            return null;
        }

        const assignments = await RegionAssignment.find({
            disaster: { $in: nearbyDisasterIds },
            status: { $in: ['assigned', 'in-progress'] }
        }).populate('assignedNGOs');

        if (assignments.length === 0) {
            console.log('⚠️  No NGOs assigned to nearby disasters');
            return null;
        }

        // Step 3: Score NGOs by capacity
        const candidates = [];

        for (const assignment of assignments) {
            // Get disaster distance for this assignment
            const disasterDist = disastersWithDistance.find(
                d => d.disaster._id.toString() === assignment.disaster.toString()
            );
            const distanceKm = disasterDist?.distance || Infinity;

            for (const ngo of assignment.assignedNGOs) {
                if (!ngo || ngo.status !== 'approved' || ngo.verificationStatus !== 'verified') continue;

                // Capacity check
                const capacity = await ngo.calculateEffectiveCapacity();
                const available = capacity.effectiveCapacity - ngo.activeDistributions;

                if (available < aidRequest.peopleCount) {
                    console.log(`❌ ${ngo.name}: insufficient capacity (${available} < ${aidRequest.peopleCount})`);
                    continue;
                }

                // Score: closer disaster = higher score
                const distanceScore = Math.max(0, 100 - distanceKm);
                const capacityScore = Math.min(50, (available / Math.max(aidRequest.peopleCount, 1)) * 25);
                const totalScore = distanceScore + capacityScore;

                console.log(`✅ ${ngo.name}: disaster ${distanceKm.toFixed(1)}km away, capacity=${available}, score=${totalScore.toFixed(1)}`);
                candidates.push({ ngo, totalScore, distanceKm, available });
            }
        }

        if (candidates.length === 0) {
            console.log('⚠️  No eligible NGO found');
            return null;
        }

        candidates.sort((a, b) => b.totalScore - a.totalScore);
        console.log(`✅ Best NGO: ${candidates[0].ngo.name} (score: ${candidates[0].totalScore.toFixed(1)}, distance: ${candidates[0].distanceKm.toFixed(1)}km)`);
        return candidates[0].ngo;

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

        // Add user to req.body if logged in
        if (req.user) {
            req.body.requester = req.user.id;
        }

        // Parse and store coordinates
        const coords = parseLocation(req.body.location);
        if (coords) {
            req.body.coordinates = coords;
        }

        // Auto-create victim account if not logged in (using CNIC)
        if (!req.user && req.body.victimCNIC && req.body.victimPhone) {
            const User = require('../models/User');
            // Normalize CNIC - strip all dashes and spaces
            const normalizedCNIC = req.body.victimCNIC.replace(/[-\s]/g, '');
            req.body.victimCNIC = normalizedCNIC; // Store normalized

            let victimUser = await User.findOne({ cnic: normalizedCNIC });

            if (!victimUser) {
                victimUser = await User.create({
                    name: req.body.victimName,
                    email: `${normalizedCNIC}@victim.dms`,
                    password: normalizedCNIC,
                    role: 'victim',
                    phone: req.body.victimPhone,
                    cnic: normalizedCNIC
                });
                console.log(`✅ Auto-created victim account for CNIC: ${normalizedCNIC}`);
            }
            req.body.requester = victimUser._id;
        }

        // Find best NGO for this request
        const bestNGO = await findBestNGO(req.body);

        if (bestNGO) {
            req.body.assignedNGO = bestNGO._id;
            req.body.status = 'approved';
        } else {
            req.body.status = 'pending';
        }

        const aidRequest = await AidRequest.create(req.body);
        await aidRequest.populate('assignedNGO', 'name contact');

        // Send notifications
        const notif = require('../services/notification.service');
        if (aidRequest.requester) {
            await notif.notifyUser(
                aidRequest.requester,
                'Aid Request Submitted',
                bestNGO
                    ? `Your request has been approved and assigned to ${bestNGO.name}.`
                    : 'Your request has been received and is pending assignment.',
                'aid_request_assigned',
                { icon: 'check_circle', priority: 'high', link: '/dashboard/victim/requests' }
            );
        }
        if (bestNGO) {
            // Notify NGO admin
            const User = require('../models/User');
            const ngoAdmin = await User.findOne({ role: 'ngo' });
            if (ngoAdmin) {
                await notif.notifyUser(
                    ngoAdmin._id,
                    'New Aid Request Assigned',
                    `A new ${aidRequest.urgency} priority aid request has been assigned to your organization.`,
                    'aid_request_assigned',
                    { icon: 'medical_services', priority: aidRequest.urgency === 'critical' ? 'critical' : 'high', link: '/dashboard/ngo/aid-requests' }
                );
            }
        }

        res.status(201).json({
            success: true,
            data: aidRequest,
            message: bestNGO
                ? `Request auto-assigned to ${bestNGO.name}`
                : 'Request created - awaiting manual assignment'
        });
    } catch (error) {
        console.error('❌ Create Request Error:', error);
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

// @desc    Get logged in user's requests (by userId OR by CNIC)
// @route   GET /api/aid-requests/my-requests
// @access  Private
exports.getMyRequests = async (req, res) => {
    try {
        let requests;

        if (req.user.role === 'victim') {
            const User = require('../models/User');
            const user = await User.findById(req.user.id);
            const normalizedCNIC = user?.cnic?.replace(/[-\s]/g, '');

            if (normalizedCNIC) {
                requests = await AidRequest.find({
                    $or: [
                        { requester: req.user.id },
                        { victimCNIC: normalizedCNIC }
                    ]
                }).populate('assignedNGO', 'name contact').sort('-createdAt');
            } else {
                requests = await AidRequest.find({ requester: req.user.id })
                    .populate('assignedNGO', 'name contact').sort('-createdAt');
            }

            // For each request, find the nearest active distribution shift to the victim
            const DistributionShift = require('../models/DistributionShift');
            const now = new Date();

            const requestsWithShifts = await Promise.all(requests.map(async (r) => {
                const reqObj = r.toObject();

                if (!r.assignedNGO) return reqObj;

                // Get all active shifts for this NGO
                const shifts = await DistributionShift.find({
                    organization: r.assignedNGO._id,
                    status: 'active',
                    shiftEnd: { $gte: now }
                }).select('location coordinates shiftStart shiftEnd totalDistributions notes');

                if (shifts.length === 0) return reqObj;

                // Find nearest shift to victim's location
                let nearestShift = shifts[0];
                if (r.coordinates?.latitude && shifts.length > 1) {
                    let minDist = Infinity;
                    for (const shift of shifts) {
                        if (shift.coordinates?.latitude && shift.coordinates?.longitude) {
                            const dist = Math.sqrt(
                                Math.pow(r.coordinates.latitude - shift.coordinates.latitude, 2) +
                                Math.pow(r.coordinates.longitude - shift.coordinates.longitude, 2)
                            );
                            if (dist < minDist) {
                                minDist = dist;
                                nearestShift = shift;
                            }
                        }
                    }
                }

                reqObj.nearestShift = nearestShift;
                return reqObj;
            }));

            return res.status(200).json({
                success: true,
                count: requestsWithShifts.length,
                data: requestsWithShifts
            });
        } else {
            requests = await AidRequest.find({ requester: req.user.id })
                .populate('assignedNGO', 'name contact').sort('-createdAt');
        }

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
// @access  Private (Admin/NGO/Volunteer)
exports.updateRequestStatus = async (req, res) => {
    try {
        let request = await AidRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Aid request not found'
            });
        }

        // Role-based access control
        if (req.user.role === 'volunteer') {
            // Volunteers can only mark as fulfilled (through task completion)
            if (req.body.status && req.body.status !== 'fulfilled') {
                return res.status(403).json({
                    success: false,
                    message: 'Volunteers can only mark requests as fulfilled'
                });
            }
            req.body.fulfilledBy = req.user.id;
            req.body.fulfilledDate = Date.now();
        }

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

// @desc    Get aid request details for volunteer (limited info)
// @route   GET /api/aid-requests/:id/volunteer-view
// @access  Private (Volunteer only)
exports.getRequestForVolunteer = async (req, res) => {
    try {
        const request = await AidRequest.findById(req.params.id)
            .select('victimName location coordinates packagesNeeded urgency peopleCount status')
            .populate('assignedNGO', 'name contact.phone');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Aid request not found'
            });
        }

        // Return limited information (no CNIC, no phone, only first name)
        const limitedData = {
            _id: request._id,
            victimName: request.victimName.split(' ')[0], // Only first name
            location: request.location,
            coordinates: request.coordinates,
            packagesNeeded: request.packagesNeeded,
            urgency: request.urgency,
            peopleCount: request.peopleCount,
            status: request.status,
            ngoContact: request.assignedNGO?.contact?.phone // For emergencies
        };

        res.status(200).json({
            success: true,
            data: limitedData
        });
    } catch (error) {
        console.error('Get Request For Volunteer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching request details',
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

// @desc    Create distribution task from aid request
// @route   POST /api/aid-requests/:id/create-task
// @access  Private (NGO/Admin only)
exports.createDistributionTask = async (req, res) => {
    try {
        const aidRequest = await AidRequest.findById(req.params.id)
            .populate('assignedNGO');

        if (!aidRequest) {
            return res.status(404).json({
                success: false,
                message: 'Aid request not found'
            });
        }

        // Verify user has permission (NGO admin or system admin)
        if (req.user.role !== 'admin' && req.user.role !== 'ngo') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create tasks'
            });
        }

        const Task = require('../models/Task');

        // Create a delivery task with limited victim information
        const task = await Task.create({
            taskType: 'delivery',
            title: `Deliver aid to ${aidRequest.victimName.split(' ')[0]}`, // Only first name
            description: `Deliver ${aidRequest.packagesNeeded.map(p => `${p.quantity}x ${p.packageName}`).join(', ')} to victim at specified location. Contact NGO for any issues.`,
            organization: aidRequest.assignedNGO._id,
            relatedAidRequest: aidRequest._id,
            priority: aidRequest.urgency === 'critical' ? 'critical' : 
                     aidRequest.urgency === 'high' ? 'high' : 'medium',
            location: aidRequest.location,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            createdBy: req.user.id
        });

        // Update aid request status to in_progress
        aidRequest.status = 'in_progress';
        await aidRequest.save();

        console.log(`✅ Distribution task created for aid request ${aidRequest._id}`);

        res.status(201).json({
            success: true,
            data: task,
            message: 'Distribution task created successfully'
        });
    } catch (error) {
        console.error('Create Distribution Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating distribution task',
            error: error.message
        });
    }
};
