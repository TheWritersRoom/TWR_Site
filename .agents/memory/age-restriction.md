---
name: Age restriction system
description: How adult content gating works — DB columns, API enforcement, and frontend flows
---

## Rule
Projects can be flagged `is_adult_content`. Users with a confirmed DOB under 18 are blocked from viewing other users' adult projects (403 age_restricted). Users with no DOB (legacy/beta accounts) are allowed through to avoid breaking existing users. Project owners are never blocked from their own content.

**Why:** Balances legal obligation to gate adult content vs. not breaking existing beta users who signed up before DOB was collected.

**How to apply:**
- Gate is enforced server-side in `GET /projects/:id` — never rely on frontend-only checks
- `isUnder18(dateOfBirth)` helper in projects.ts handles the age calculation
- Frontend renders a full-page block when `project.error === "age_restricted"`
- `is_adult_content` defaults to false for all existing projects
