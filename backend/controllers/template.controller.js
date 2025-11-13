const AgentTemplate = require('../models/AgentTemplate');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get all templates (user's templates + public templates)
 */
exports.getAllTemplates = catchAsync(async (req, res, next) => {
    const { isPublic, page = 1, limit = 20 } = req.query;
    const userId = req.user ? req.user.id : null;

    // Build filter
    const filter = {};
    if (isPublic === 'true') {
        filter.isPublic = true;
    } else if (userId) {
        // Get user's templates + public templates
        filter.$or = [
            { createdBy: userId },
            { isPublic: true }
        ];
    } else {
        // No user - only public templates
        filter.isPublic = true;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const templates = await AgentTemplate.find(filter)
        .populate('createdBy', 'username email')
        .sort({ lastUsedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await AgentTemplate.countDocuments(filter);

    res.status(200).json({
        status: 'success',
        results: templates.length,
        total: total,
        page: parseInt(page),
        limit: parseInt(limit),
        data: {
            templates: templates
        }
    });
});

/**
 * Get a single template by ID
 */
exports.getTemplate = catchAsync(async (req, res, next) => {
    const template = await AgentTemplate.findById(req.params.templateId)
        .populate('createdBy', 'username email');

    if (!template) {
        return next(new AppError('Template not found', 404));
    }

    // Check if user can access (owner or public)
    if (req.user.role !== 'admin' && 
        template.createdBy.toString() !== req.user.id && 
        !template.isPublic) {
        return next(new AppError('You do not have permission to view this template', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            template: template
        }
    });
});

/**
 * Create a new template
 */
exports.createTemplate = catchAsync(async (req, res, next) => {
    const { name, description, config, isPublic } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return next(new AppError('User not authenticated', 401));
    }

    if (!name || !config) {
        return next(new AppError('Name and config are required', 400));
    }

    const template = new AgentTemplate({
        name,
        description: description || '',
        config,
        createdBy: userId,
        isPublic: isPublic === true
    });

    await template.save();

    res.status(201).json({
        status: 'success',
        data: {
            template: template
        }
    });
});

/**
 * Update a template
 */
exports.updateTemplate = catchAsync(async (req, res, next) => {
    const { name, description, config, isPublic } = req.body;
    const template = await AgentTemplate.findById(req.params.templateId);

    if (!template) {
        return next(new AppError('Template not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to update this template', 403));
    }

    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (config) template.config = config;
    if (isPublic !== undefined) template.isPublic = isPublic;

    await template.save();

    res.status(200).json({
        status: 'success',
        data: {
            template: template
        }
    });
});

/**
 * Delete a template
 */
exports.deleteTemplate = catchAsync(async (req, res, next) => {
    const template = await AgentTemplate.findById(req.params.templateId);

    if (!template) {
        return next(new AppError('Template not found', 404));
    }

    // Check ownership or admin
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user.id) {
        return next(new AppError('You do not have permission to delete this template', 403));
    }

    await AgentTemplate.findByIdAndDelete(req.params.templateId);

    res.status(204).json({
        status: 'success',
        data: null
    });
});

/**
 * Use a template (load config and increment usage)
 */
exports.useTemplate = catchAsync(async (req, res, next) => {
    const template = await AgentTemplate.findById(req.params.templateId);

    if (!template) {
        return next(new AppError('Template not found', 404));
    }

    // Check if user can access (owner or public)
    if (req.user.role !== 'admin' && 
        template.createdBy.toString() !== req.user.id && 
        !template.isPublic) {
        return next(new AppError('You do not have permission to use this template', 403));
    }

    // Increment usage count and update last used
    template.usageCount += 1;
    template.lastUsedAt = new Date();
    await template.save();

    res.status(200).json({
        status: 'success',
        data: {
            config: template.config,
            template: {
                id: template._id,
                name: template.name,
                description: template.description
            }
        }
    });
});

