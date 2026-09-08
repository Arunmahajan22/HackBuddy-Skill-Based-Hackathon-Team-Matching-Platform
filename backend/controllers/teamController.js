const Team = require('../models/Team');

/**
 * Escapes regex special characters to prevent ReDoS injection.
 */
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Create a new team opening.
 */
exports.createTeam = async (req, res, next) => {
  try {
    const { hackathonName, description, requiredSkills, teamSizeLimit } = req.body;

    const team = await Team.create({
      hackathonName: hackathonName.trim(),
      description: description.trim(),
      requiredSkills: Array.isArray(requiredSkills)
        ? requiredSkills.map((s) => String(s).trim()).filter(Boolean)
        : [],
      teamSizeLimit: Number(teamSizeLimit),
      creator: req.user._id,
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('creator', 'name branch year skills experienceLevel github')
      .populate('members', 'name branch year skills experienceLevel github')
      .lean();

    return res.status(201).json({
      success: true,
      team: populatedTeam,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Explore teams with search filters, skill match, and cursor/page pagination.
 */
exports.getTeams = async (req, res, next) => {
  try {
    const { q, skill, page = 1, limit = 12 } = req.query;
    const filters = [];

    if (q && typeof q === 'string' && q.trim()) {
      const sanitizedQuery = escapeRegex(q.trim().slice(0, 100));
      const expression = new RegExp(sanitizedQuery, 'i');
      filters.push({
        $or: [{ hackathonName: expression }, { description: expression }],
      });
    }

    if (skill && typeof skill === 'string' && skill.trim()) {
      const sanitizedSkill = escapeRegex(skill.trim().slice(0, 50));
      filters.push({
        requiredSkills: new RegExp(`^${sanitizedSkill}$`, 'i'),
      });
    }

    const filter = filters.length > 0 ? { $and: filters } : {};
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

    const [teams, total] = await Promise.all([
      Team.find(filter)
        .populate('creator', 'name branch year skills experienceLevel github')
        .populate('members', 'name branch year skills experienceLevel github')
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Team.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return res.status(200).json({
      success: true,
      teams,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all teams created by the authenticated user.
 */
exports.getMyTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ creator: req.user._id })
      .populate('creator', 'name branch year skills experienceLevel github')
      .populate('members', 'name branch year skills experienceLevel github')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    return next(error);
  }
};

/** Get teams where the authenticated user is a member, including teams they created. */
exports.getJoinedTeams = async (req, res, next) => {
  try {
    const teams = await Team.find({ members: req.user._id })
      .select('hackathonName description requiredSkills teamSizeLimit creator members createdAt')
      .populate('creator', 'name')
      .sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, teams });
  } catch (error) { return next(error); }
};

/**
 * Get a specific team by its ObjectId.
 */
exports.getTeamById = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('creator', 'name branch year bio github skills experienceLevel')
      .populate('members', 'name branch year bio github skills experienceLevel')
      .lean();

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    return res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    return next(error);
  }
};
