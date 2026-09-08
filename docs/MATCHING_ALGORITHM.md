# Matching Algorithm

Smart Match recommendations come from `GET /api/users/recommendations`, not frontend scoring. The backend normalizes skills, interests, and preferred roles, infers broad role families, calculates a deterministic 0–100 score, returns reasons, then sorts candidates descending.

| Signal | Maximum | Behavior |
| --- | ---: | --- |
| Complementary roles | 50 | Rewards a candidate role absent from the current user, e.g. frontend + backend. |
| New skills | 10 | Rewards skills the candidate brings that the user does not list. |
| Shared interests | 20 | Rewards overlapping hackathon themes. |
| Shared skills | 5 | Gives a small fluency signal but does not dominate complements. |
| Experience compatibility | 10 | Gives points for equal or adjacent experience levels. |

For `n` users with at most `s` profile terms, feature calculation is `O(n × s)` and ranking is `O(n log n)`. A 60-second per-process cache avoids recalculation on every page load and is cleared after profile updates.

This is explainable but heuristic: it does not know communication style, actual schedule quality, or unlisted capabilities. A future ML approach could use accepted requests and user feedback to learn weights, while retaining explanation and fairness controls.
