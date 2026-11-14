# Matching Algorithm

Smart Match recommendations come from `GET /api/users/recommendations`, evaluated deterministically on the server. The algorithm pairs builders based on both technical capabilities and schedule compatibility.

## Scoring Breakdown (0–100 Scale)

| Signal | Maximum Score | Behavior |
| --- | ---: | --- |
| Complementary roles | +35 | Rewards a candidate role absent from the current user (e.g. frontend + backend, or AI/ML + DevOps). |
| Availability compatibility | +25 | Rewards matching status (`open`), overlapping days of week, and shared working hours. |
| Shared hackathon interests | +15 | Rewards overlapping project themes (AI, Web3, FinTech, etc.). |
| New complementary skills | +10 | Rewards skills the candidate brings that the user does not list. |
| Experience compatibility | +10 | Rewards equal or adjacent experience levels. |
| Shared skills | +5 | Small collaboration baseline. |
| Unavailable penalty | -25 | Heavy penalty if the candidate's status is set to `unavailable`. |

## Explainable Output

The algorithm never produces an opaque number without context. Each calculation produces transparent, human-readable reasons returned alongside the score (e.g. *"Available on weekdays"*, *"Matching working hours"*, *"Complementary Frontend + Backend strengths"*), allowing users to make informed teammate decisions.
