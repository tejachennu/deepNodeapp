const Project = require('../models/Project');
const { validationResult } = require('express-validator');

// Create a new project
exports.createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const projectId = await Project.create({
            ...req.body,
            createdBy: req.user.userId
        });

        const project = await Project.findById(projectId);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: { project }
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ success: false, message: 'Failed to create project' });
    }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const filters = {
            organizationId: req.query.organizationId,
            status: req.query.status,
            search: req.query.search,
            startDateFrom: req.query.startDateFrom,
            startDateTo: req.query.startDateTo,
            isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        // If not admin, filter by user's organization
        if (req.user.roleCode !== 'SUPER_ADMIN' && req.user.roleCode !== 'ADMIN') {
            filters.organizationId = req.user.organizationId;
        }

        const projects = await Project.findAll(filters);

        res.json({
            success: true,
            data: {
                projects,
                count: projects.length
            }
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch projects' });
    }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check access for non-admins
        if (req.user.roleCode !== 'SUPER_ADMIN' && req.user.roleCode !== 'ADMIN') {
            if (project.OrganizationId !== req.user.organizationId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        res.json({
            success: true,
            data: { project }
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch project' });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check access for non-admins
        if (req.user.roleCode !== 'SUPER_ADMIN' && req.user.roleCode !== 'ADMIN') {
            if (project.OrganizationId !== req.user.organizationId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        const updated = await Project.update(req.params.id, req.body, req.user.userId);

        if (!updated) {
            return res.status(400).json({ success: false, message: 'No changes made' });
        }

        const updatedProject = await Project.findById(req.params.id);

        res.json({
            success: true,
            message: 'Project updated successfully',
            data: { project: updatedProject }
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ success: false, message: 'Failed to update project' });
    }
};

// Delete project
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check access for non-admins
        if (req.user.roleCode !== 'SUPER_ADMIN' && req.user.roleCode !== 'ADMIN') {
            if (project.OrganizationId !== req.user.organizationId) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        await Project.delete(req.params.id, req.user.userId);

        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete project' });
    }
};

// Get project statistics
exports.getProjectStats = async (req, res) => {
    try {
        let organizationId = req.query.organizationId;

        // If not admin, use user's organization
        if (req.user.roleCode !== 'SUPER_ADMIN' && req.user.roleCode !== 'ADMIN') {
            organizationId = req.user.organizationId;
        }

        const stats = await Project.getStats(organizationId);

        res.json({
            success: true,
            data: { stats }
        });
    } catch (error) {
        console.error('Get project stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
};

// Upload project banner
exports.uploadBanner = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // For now, store locally. In production, upload to Azure Blob
        const bannerUrl = `/uploads/banners/${req.file.filename}`;

        await Project.update(req.params.id, { bannerUrl }, req.user.userId);

        res.json({
            success: true,
            message: 'Banner uploaded successfully',
            data: { bannerUrl }
        });
    } catch (error) {
        console.error('Upload banner error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload banner' });
    }
};
