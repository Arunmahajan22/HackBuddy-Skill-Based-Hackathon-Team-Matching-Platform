const User = require('../models/User');

/**
 * Get authenticated user's full profile.
 */
exports.getProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

/**
 * Update authenticated user's profile information.
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'branch', 'year', 'bio', 'github', 'skills', 'experienceLevel'];
    const updatePayload = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'skills' && Array.isArray(req.body.skills)) {
          updatePayload.skills = [...new Set(req.body.skills.map((s) => String(s).trim()).filter(Boolean))];
        } else if (field === 'year') {
          updatePayload.year = Number(req.body.year);
        } else if (typeof req.body[field] === 'string') {
          updatePayload[field] = req.body[field].trim();
        } else {
          updatePayload[field] = req.body[field];
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatePayload },
      { new: true, runValidators: true },
    ).select('-password').lean();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
};
