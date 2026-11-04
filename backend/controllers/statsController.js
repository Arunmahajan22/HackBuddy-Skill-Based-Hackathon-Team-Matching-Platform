const User = require('../models/User');
const Team = require('../models/Team');
const Request = require('../models/Request');

/**
 * Get live platform statistics, top skills, and featured openings from real database records.
 * GET /api/stats
 */
exports.getPlatformStats = async (_req, res, next) => {
  try {
    const [
      totalUsers,
      totalTeams,
      totalMatches,
      openSpotsAgg,
      topSkillsAgg,
      featuredTeams,
      featuredBuilders,
    ] = await Promise.all([
      // Total verified or registered users
      User.countDocuments({ isVerified: true }).then((count) =>
        count > 0 ? count : User.countDocuments(),
      ),

      // Total posted teams
      Team.countDocuments(),

      // Total accepted matches
      Request.countDocuments({ status: 'accepted' }),

      // Sum of open seats across all teams
      Team.aggregate([
        {
          $project: {
            open: {
              $max: [
                0,
                {
                  $subtract: [
                    '$teamSizeLimit',
                    { $size: { $ifNull: ['$members', []] } },
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalOpen: { $sum: '$open' },
          },
        },
      ]),

      // Aggregate top 16 most declared skills in database
      User.aggregate([
        { $unwind: '$skills' },
        {
          $group: {
            _id: { $toLower: { $trim: { input: '$skills' } } },
            originalName: { $first: '$skills' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 16 },
      ]),

      // 3 Recent featured team openings with populated creator
      Team.find()
        .populate('creator', 'name branch year skills experienceLevel')
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),

      // 4 Public verified builder profiles
      User.find({ skills: { $exists: true, $not: { $size: 0 } } })
        .select('name branch year skills experienceLevel bio github')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
    ]);

    const totalOpenings = openSpotsAgg[0]?.totalOpen || 0;

    const topSkills =
      topSkillsAgg && topSkillsAgg.length > 0
        ? topSkillsAgg.map((s) => s.originalName)
        : [
            'React',
            'Node.js',
            'Python',
            'TypeScript',
            'UI/UX',
            'AI / ML',
            'Next.js',
            'Tailwind CSS',
            'Go',
            'Solidity',
          ];

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTeams,
        totalMatches,
        totalOpenings,
      },
      topSkills,
      featuredTeams: featuredTeams || [],
      featuredBuilders: featuredBuilders || [],
    });
  } catch (error) {
    return next(error);
  }
};
