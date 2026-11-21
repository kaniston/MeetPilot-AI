export const REVIEW_LABELS = {
  unreviewed: { label: 'Needs review', tone: 'warning' },
  revised: { label: 'Revised decision', tone: 'blue' },
  contradiction: { label: 'Contradiction', tone: 'danger' },
  unrelated: { label: 'Unrelated update', tone: 'neutral' },
};

export const REVIEW_OPTIONS = [
  { value: 'unreviewed', label: 'Needs review' },
  { value: 'revised', label: 'Revised decision' },
  { value: 'contradiction', label: 'Contradiction' },
  { value: 'unrelated', label: 'Unrelated update' },
];

export function reviewMeta(status) {
  return REVIEW_LABELS[status] || REVIEW_LABELS.unreviewed;
}
