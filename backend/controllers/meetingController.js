import { createMeeting, getMeetingById, listMeetings } from '../services/meetingService.js';

export function getMeetings(req, res) {
  res.json({ data: listMeetings() });
}

export function getMeeting(req, res) {
  res.json({ data: getMeetingById(req.params.id) });
}

export function postMeeting(req, res) {
  const result = createMeeting(req.body || {});
  res.status(201).json({ data: result });
}
