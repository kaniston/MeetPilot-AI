import { Router } from 'express';
import {
  getMeeting,
  getMeetings,
  postMeeting,
} from '../controllers/meetingController.js';
import { postAnalyzeMeeting } from '../controllers/aiController.js';
import { postTranscribeAudio } from '../controllers/aiController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import multer from 'multer';

const router = Router();
const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (
      !file.mimetype.startsWith('audio/') &&
      !['video/webm', 'application/octet-stream'].includes(file.mimetype)
    ) {
      return callback(
        new AppError('Only audio or WebM recording files are accepted.', 400, {
          field: 'audio',
        }),
      );
    }
    callback(null, true);
  },
});

router.get('/', getMeetings);
router.post('/', postMeeting);
router.post('/analyze', asyncHandler(postAnalyzeMeeting));
router.post('/transcribe', audioUpload.single('audio'), asyncHandler(postTranscribeAudio));
router.get('/:id', getMeeting);

export default router;
