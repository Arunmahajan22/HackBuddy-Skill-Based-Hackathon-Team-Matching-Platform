# Smart Match Score

`GET /api/users/recommendations?limit=20` returns authenticated users with public profile data only, plus `matchScore`, `reasons`, and `strongestComplementarySkills`. It never returns email, password, authentication data, timestamps, or other internal fields.

## Algorithm

The score is deterministic and clamped to 0–100. The important design choice is that a missing role is more valuable than another copy of the same role.

| Factor | Maximum | Purpose |
| --- | ---: | --- |
| Complementary inferred/preferred roles | 50 | Rewards a candidate who fills a role absent from your stack, such as frontend + backend. |
| New complementary skills | 10 | Rewards useful skills the candidate brings that you do not list. |
| Shared hackathon interests | 20 | Rewards common project themes such as AI or climate. |
| Shared skills | 5 | Gives a small collaboration signal, without letting identical stacks dominate. |
| Experience compatibility | 10 | Gives credit for equal or adjacent experience levels. |

Roles are inferred from known skill families (frontend, backend, AI/ML, design, DevOps, mobile, blockchain) and may also be supplied in `preferredRoles`. Optional `interests` and `preferredRoles` were added to the existing user profile so members can make recommendations more meaningful. Availability is not scored because HackBuddy does not currently collect it.

Each positive contribution emits a human-readable reason. For example: “Complementary Frontend + Backend strengths” and “Shared interest in AI.”

## Performance and tradeoffs

For `n` candidate users and at most `s` normalized skills/interests per profile, calculation is `O(n × s)` and sorting is `O(n log n)`. The endpoint uses a 60-second per-user in-process cache and clears cached recommendations after a profile update. This avoids recalculation on every frontend render while keeping changes reasonably fresh.

The cache is deliberately simple for the existing single-process architecture. In a horizontally scaled deployment, replace it with Redis and publish profile-update invalidations. At large scale, precompute score features or use database candidate filters before scoring.

This is a transparent heuristic, not a prediction of team success. It cannot assess communication style, schedule, commitment, or unlisted skills, and sparse profiles get lower-quality recommendations. A future ML version could learn weights from accepted requests, successful team outcomes, and user feedback—but should retain explanation and fairness checks.

## Interview explanation

“I kept matching on the server so the score is consistent and cannot be manipulated by the UI. I translate skills into broad roles, reward candidates who cover a missing role much more than candidates who duplicate it, then add smaller signals for shared project interests and compatible experience. The API returns both a 0–100 score and the exact reasons behind it, so users can judge the recommendation instead of trusting a black box.”
