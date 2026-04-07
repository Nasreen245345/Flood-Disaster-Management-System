const Task = require('../models/Task');
const Volunteer = require('../models/Volunteer');
const Organization = require('../models/Organization');

exports.createTask = async (req, res) => {
    try {
        console.log('=== CREATE TASK ===');
        console.log('Request Body:', req.body);
        
        req.body.createdBy = req.user.id;
        
        const task = await Task.create(req.body);
        
        console.log('Task Created:', task._id);
        
        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Create Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating task',
            error: error.message
        });
    }
};

exports.getOrganizationTasks = async (req, res) => {
    try {
        const { status, priority } = req.query;
        
        const query = { organization: req.params.orgId };
        
        if (status) query.status = status;
        if (priority) query.priority = priority;
        
        const tasks = await Task.find(query)
            .populate('assignedVolunteer', 'fullName phone category')
            .populate('relatedAidRequest', 'victimName location urgency')
            .sort('-priority -createdAt');
        
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Get Organization Tasks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks',
            error: error.message
        });
    }
};

// @desc    Get tasks for a volunteer
// @route   GET /api/tasks/volunteer/:volunteerId
// @access  Private (Volunteer/NGO/Admin)
exports.getVolunteerTasks = async (req, res) => {
    try {
        const { status } = req.query;
        
        const query = { assignedVolunteer: req.params.volunteerId };
        
        if (status) query.status = status;
        
        const tasks = await Task.find(query)
            .populate('organization', 'name contact')
            .populate('relatedAidRequest', 'victimName location urgency')
            .sort('-priority -createdAt');
        
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Get Volunteer Tasks Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching volunteer tasks',
            error: error.message
        });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('organization', 'name contact')
            .populate('assignedVolunteer', 'fullName phone category')
            .populate('relatedAidRequest', 'victimName location urgency packagesNeeded');
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Get Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching task',
            error: error.message
        });
    }
};

// @desc    Assign task to volunteer
// @route   PUT /api/tasks/:id/assign
// @access  Private (NGO/Admin)
exports.assignTask = async (req, res) => {
    try {
        const { volunteerId } = req.body;
        
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        // Verify volunteer exists and belongs to same organization
        const volunteer = await Volunteer.findById(volunteerId);
        
        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: 'Volunteer not found'
            });
        }
        
        if (volunteer.assignedNGO.toString() !== task.organization.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Volunteer does not belong to this organization'
            });
        }
        
        task.assignedVolunteer = volunteerId;
        task.status = 'assigned';
        await task.save();
        
        await task.populate('assignedVolunteer', 'fullName phone category');
        
        console.log(`✅ Task ${task._id} assigned to volunteer ${volunteer.fullName}`);
        
        res.status(200).json({
            success: true,
            data: task,
            message: `Task assigned to ${volunteer.fullName}`
        });
    } catch (error) {
        console.error('Assign Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning task',
            error: error.message
        });
    }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private (Volunteer/NGO/Admin)
exports.updateTaskStatus = async (req, res) => {
    try {
        const { status, completionNotes } = req.body;
        
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        task.status = status;
        
        if (completionNotes) {
            task.completionNotes = completionNotes;
        }
        
        if (status === 'completed') {
            task.completedAt = Date.now();
            
            // If task is linked to an aid request, update the aid request status
            if (task.relatedAidRequest) {
                const AidRequest = require('../models/AidRequest');
                await AidRequest.findByIdAndUpdate(
                    task.relatedAidRequest,
                    {
                        status: 'fulfilled',
                        fulfilledBy: req.user.id,
                        fulfilledDate: Date.now()
                    }
                );
                console.log(`✅ Aid Request ${task.relatedAidRequest} marked as fulfilled`);
            }
        }
        
        await task.save();
        
        console.log(`✅ Task ${task._id} status updated to: ${status}`);
        
        res.status(200).json({
            success: true,
            data: task,
            message: `Task status updated to ${status}`
        });
    } catch (error) {
        console.error('Update Task Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task status',
            error: error.message
        });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (NGO/Admin)
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Update Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task',
            error: error.message
        });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (NGO/Admin)
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        await task.deleteOne();
        
        res.status(200).json({
            success: true,
            data: {},
            message: 'Task deleted successfully'
        });
    } catch (error) {
        console.error('Delete Task Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting task',
            error: error.message
        });
    }
};

// @desc    Get available volunteers for task assignment
// @route   GET /api/tasks/:id/available-volunteers
// @access  Private (NGO/Admin)
exports.getAvailableVolunteers = async (req, res) => {
    try {
        console.log('=== GET AVAILABLE VOLUNTEERS ===');
        console.log('Task ID:', req.params.id);
        
        const task = await Task.findById(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }
        
        console.log('Task Organization:', task.organization);
        
        // Get volunteers from the same organization (relaxed criteria for better UX)
        const volunteers = await Volunteer.find({
            assignedNGO: task.organization,
            status: 'active'
            // Removed strict verification and availability checks to show more volunteers
        })
        .populate('userId', 'name phone')
        .select('fullName phone category skillLevel availabilityStatus verificationStatus');
        
        console.log(`Found ${volunteers.length} volunteers for organization`);
        
        // Get current task count for each volunteer
        const volunteersWithTaskCount = await Promise.all(
            volunteers.map(async (volunteer) => {
                const activeTasks = await Task.countDocuments({
                    assignedVolunteer: volunteer._id,
                    status: { $in: ['assigned', 'in_progress'] }
                });
                
                return {
                    ...volunteer.toObject(),
                    activeTaskCount: activeTasks
                };
            })
        );
        
        // Sort by active task count (least busy first)
        volunteersWithTaskCount.sort((a, b) => a.activeTaskCount - b.activeTaskCount);
        
        res.status(200).json({
            success: true,
            count: volunteersWithTaskCount.length,
            data: volunteersWithTaskCount
        });
    } catch (error) {
        console.error('Get Available Volunteers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available volunteers',
            error: error.message
        });
    }
};
