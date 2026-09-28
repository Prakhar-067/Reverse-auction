const Category = require('../models/Category');
const AuditService = require('../services/auditService');
const ApiResponse = require('../utils/ApiResponse');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return ApiResponse.success(res, categories);
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, parent } = req.body;
    if (!name) return ApiResponse.badRequest(res, 'Category name is required.');

    const category = await Category.create({
      name,
      description,
      parent,
      createdBy: req.user._id,
    });

    await AuditService.log({
      actor: req.user._id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'CATEGORY_CREATED',
      entityType: 'CATEGORY',
      entityId: category._id,
      description: `Category "${category.name}" created`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return ApiResponse.created(res, category);
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return ApiResponse.notFound(res, 'Category not found.');
    return ApiResponse.success(res, category, 'Category updated.');
  } catch (error) {
    next(error);
  }
};
