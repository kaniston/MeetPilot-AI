import { listDecisions, updateConflictReview } from '../services/decisionService.js';
import { AppError } from '../utils/AppError.js';

const REVIEW_STATUSES = ['unreviewed', 'revised', 'contradiction', 'unrelated'];

export function getDecisions(req, res) {
  res.json({ data: listDecisions() });
}

export function patchConflict(req, res) {
  const { reviewStatus } = req.body || {};

  if (!REVIEW_STATUSES.includes(reviewStatus)) {
    throw new AppError('Invalid conflict review status.', 400, {
      field: 'reviewStatus',
      allowed: REVIEW_STATUSES,
    });
  }

  const conflict = updateConflictReview(req.params.id, reviewStatus);
  res.json({ data: conflict });
}
