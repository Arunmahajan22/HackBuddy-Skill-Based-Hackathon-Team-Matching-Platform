const User = require('../models/User');
const { calculateMatchScore } = require('../services/matchScoreService');

const recommendationCache = new Map();
const CACHE_TTL_MS = 60 * 1000;
const publicProfileFields = 'name branch year bio github avatarUrl linkedin portfolio skills interests preferredRoles experienceLevel hackathonExperience availability preferredTeamSize projects';

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
    const allowedFields = ['name', 'branch', 'year', 'bio', 'github', 'avatarUrl', 'linkedin', 'portfolio', 'skills', 'interests', 'preferredRoles', 'experienceLevel', 'hackathonExperience', 'availability', 'preferredTeamSize', 'projects'];
    const updatePayload = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (['skills', 'interests', 'preferredRoles'].includes(field) && Array.isArray(req.body[field])) {
          updatePayload[field] = [...new Set(req.body[field].map((value) => String(value).trim()).filter(Boolean))];
        } else if (['year', 'hackathonExperience', 'preferredTeamSize'].includes(field)) {
          updatePayload[field] = Number(req.body[field]);
        } else if (field === 'projects' && Array.isArray(req.body.projects)) {
          updatePayload.projects = req.body.projects.map((project) => ({
            title: String(project.title || '').trim(),
            description: String(project.description || '').trim(),
            url: String(project.url || '').trim(),
            technologies: Array.isArray(project.technologies) ? [...new Set(project.technologies.map((value) => String(value).trim()).filter(Boolean))] : [],
          }));
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
    recommendationCache.clear();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
};

/** Returns cached, public-only teammate recommendations ranked by compatibility. */
exports.getRecommendations = async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const cacheKey = `${req.user._id}:${limit}`;
    const cached = recommendationCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json({ success: true, recommendations: cached.recommendations, cached: true });
    }
    const candidates = await User.find({ _id: { $ne: req.user._id } }).select(publicProfileFields).lean();
    const recommendations = candidates
      .map((candidate) => ({ user: candidate, ...calculateMatchScore(req.user, candidate) }))
      .sort((first, second) => second.matchScore - first.matchScore || first.user.name.localeCompare(second.user.name))
      .slice(0, limit);
    recommendationCache.set(cacheKey, { recommendations, expiresAt: Date.now() + CACHE_TTL_MS });
    return res.status(200).json({ success: true, recommendations, cached: false });
  } catch (error) { return next(error); }
};
