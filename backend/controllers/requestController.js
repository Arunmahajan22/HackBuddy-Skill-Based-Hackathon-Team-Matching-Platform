const Team = require('../models/Team');
const Request = require('../models/Request');

/**
 * Emits an event to a user's private socket room.
 */
const notifyUser = (req, userId, event, payload) => {
  const io = req.app.get('io');
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, payload);
  }
};

/**
 * Send a request to join a team.
 */
exports.sendJoinRequest = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { message = '' } = req.body;

    const team = await Team.findById(teamId).populate('creator', 'name');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found.',
      });
    }

    const creatorId = team.creator._id || team.creator;
    if (creatorId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot request to join a team you created.',
      });
    }

    if (team.members.some((member) => member.equals(req.user._id))) {
      return res.status(409).json({
        success: false,
        message: 'You are already a member of this team.',
      });
    }

    if (team.members.length >= team.teamSizeLimit) {
      return res.status(409).json({
        success: false,
        message: 'This team has already reached its member capacity.',
      });
    }

    // Check for existing request from this user
    const existingRequest = await Request.findOne({
      sender: req.user._id,
      team: team._id,
    });
    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${existingRequest.status} request for this team.`,
      });
    }

    const joinRequest = await Request.create({
      sender: req.user._id,
      team: team._id,
      message: message.trim(),
    });

    const populatedRequest = await Request.findById(joinRequest._id)
      .populate('sender', 'name branch year skills experienceLevel github')
      .populate('team', 'hackathonName teamSizeLimit')
      .lean();

    // Emit live notification to the team creator
    notifyUser(req, creatorId, 'request:created', {
      request: populatedRequest,
      team: { _id: team._id, hackathonName: team.hackathonName },
    });

    return res.status(201).json({
      success: true,
      request: populatedRequest,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all incoming requests across all teams created by the authenticated user.
 * Eliminates the frontend N+1 API request waterfall.
 */
exports.getIncomingRequests = async (req, res, next) => {
  try {
    const creatorTeams = await Team.find({ creator: req.user._id }).select('_id hackathonName').lean();
    if (!creatorTeams.length) {
      return res.status(200).json({
        success: true,
        requests: [],
      });
    }

    const teamIds = creatorTeams.map((t) => t._id);
    const teamNameMap = Object.fromEntries(creatorTeams.map((t) => [t._id.toString(), t.hackathonName]));

    const requests = await Request.find({ team: { $in: teamIds } })
      .populate('sender', 'name branch year bio github skills experienceLevel')
      .populate('team', 'hackathonName teamSizeLimit')
      .sort({ createdAt: -1 })
      .lean();

    const formattedRequests = requests.map((reqItem) => ({
      ...reqItem,
      teamName: reqItem.team?.hackathonName || teamNameMap[reqItem.team?.toString()] || 'Team',
    }));

    return res.status(200).json({
      success: true,
      requests: formattedRequests,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Get all requests for a specific team (creator authorized only).
 */
exports.getTeamRequests = async (req, res, next) => {
  try {
    const team = await Team.findOne({ _id: req.params.teamId, creator: req.user._id }).lean();
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found or you are not its creator.',
      });
    }

    const requests = await Request.find({ team: team._id })
      .populate('sender', 'name branch year bio github skills experienceLevel')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * Update request status (accept or reject) with atomic concurrency protection.
 */
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const joinRequest = await Request.findById(requestId).populate('team');
    if (!joinRequest) {
      return res.status(404).json({
        success: false,
        message: 'Request not found.',
      });
    }

    if (!joinRequest.team.creator.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Only the team creator can decide on this request.',
      });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(409).json({
        success: false,
        message: `This request has already been ${joinRequest.status}.`,
      });
    }

    // Atomic conditional update to prevent concurrent over-capacity membership
    if (status === 'accepted') {
      const updatedTeam = await Team.findOneAndUpdate(
        {
          _id: joinRequest.team._id,
          creator: req.user._id,
          members: { $ne: joinRequest.sender },
          $expr: { $lt: [{ $size: '$members' }, '$teamSizeLimit'] },
        },
        { $addToSet: { members: joinRequest.sender } },
        { new: true },
      );

      if (!updatedTeam) {
        return res.status(409).json({
          success: false,
          message: 'Unable to accept: The team is already full or the user is already a member.',
        });
      }
    }

    joinRequest.status = status;
    await joinRequest.save();

    const populatedRequest = await Request.findById(joinRequest._id)
      .populate('sender', 'name branch year skills experienceLevel github')
      .populate('team', 'hackathonName')
      .lean();

    // Emit live decision notification to the applicant
    notifyUser(req, joinRequest.sender, 'request:updated', {
      request: populatedRequest,
      team: {
        _id: joinRequest.team._id,
        hackathonName: joinRequest.team.hackathonName,
      },
    });

    return res.status(200).json({
      success: true,
      request: populatedRequest,
    });
  } catch (error) {
    return next(error);
  }
};
