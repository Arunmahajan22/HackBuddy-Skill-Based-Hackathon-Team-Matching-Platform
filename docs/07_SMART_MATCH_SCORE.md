# Smart Match Score

`GET /api/users/recommendations?limit=20` returns authenticated users with public profile data, plus `matchScore`, `reasons`, `strongestComplementarySkills`, and structured `availabilityMatch` data. It never returns sensitive fields such as email, password hashes, or verification tokens.

## Algorithm

The score is deterministic and clamped to 0–100. It evaluates both **technical skill complementarity** and **schedule availability compatibility**.

| Factor | Maximum Contribution | Purpose |
| --- | ---: | --- |
| Complementary inferred/preferred roles | +35 | Rewards a candidate who fills a role absent from your stack (e.g., frontend + backend, or AI/ML + DevOps). |
| Availability compatibility | +25 | Rewards schedule alignment (status `open`, overlapping available days of the week, matching preferred working hours, and time slot flexibility). |
| Shared hackathon interests | +15 | Rewards common project themes such as AI, Web3, FinTech, or ClimateTech. |
| New complementary skills | +10 | Rewards useful skills the candidate brings that you do not list. |
| Experience compatibility | +10 | Gives credit for equal or adjacent experience levels (Beginner, Intermediate, Advanced). |
| Shared skills | +5 | Gives a small collaboration signal without letting identical stacks dominate. |
| Unavailable penalty | -25 | Heavily penalizes candidates marked `unavailable` with an explicit reason. |

### Availability Scoring Breakdown
- **Status:** Candidate with `open` receives +5 bonus; candidate with `busy` receives +1; candidate with `unavailable` receives -25 penalty.
- **Available Days Overlap:** Jaccard similarity across days (`monday` through `sunday`). Overlapping days earn up to +8 points.
- **Working Hours & Time Slots:** Matching preferred working hours (`morning`, `afternoon`, `evening`, `night`, `flexible`) contributes up to +8 points. Overlapping time slots add up to +4 points.
- **Human-Readable Reasons:** Every positive score factor produces an explainable reason, such as:
  - *"Complementary Frontend + Backend strengths"*
  - *"Available on weekdays"*
  - *"Matching working hours (evening)"*
  - *"Shared interest in AI"*
  - *"Candidate is currently unavailable for new teams"* (if penalized)

## Performance and Architecture

For `n` candidate users and at most `s` normalized skills/interests per profile, calculation is `O(n × s)` and sorting is `O(n log n)`. The endpoint uses a 60-second per-user in-process cache, invalidated whenever a user updates their profile or availability.
