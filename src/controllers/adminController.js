import { ActivityLog } from '../models/ActivityLog.js';
import { sendActivityReportEmail } from '../services/mailer.js';
import { ApiError } from '../utils/ApiError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * GET /api/admin/logs
 * Filters ActivityLogs by optional `activity`, `startDate`, and `endDate`
 * query parameters, and populates `userId` so the student's email/name is
 * available to the Admin Dashboard table and PDF exporter.
 */
export async function getAdminLogs(req, res) {
  const { activity, startDate, endDate } = req.query;
  const filter = {};

  if (typeof activity === 'string' && activity.trim() && activity !== 'All') {
    filter.activityName = activity.trim();
  }

  if (startDate || endDate) {
    filter.date = {};
    if (typeof startDate === 'string' && startDate.trim()) {
      const start = new Date(`${startDate.trim()}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime())) {
        throw ApiError.badRequest('Invalid startDate format');
      }
      filter.date.$gte = start;
    }
    if (typeof endDate === 'string' && endDate.trim()) {
      const end = new Date(`${endDate.trim()}T23:59:59.999Z`);
      if (Number.isNaN(end.getTime())) {
        throw ApiError.badRequest('Invalid endDate format');
      }
      filter.date.$lte = end;
    }
  }

  const logs = await ActivityLog.find(filter)
    .populate('userId', 'email name')
    .sort({ date: -1 })
    .lean();

  res.json({ success: true, data: logs });
}

/**
 * POST /api/admin/email-report
 * Accepts `{ targetEmail, pdfBase64 }` and emails the generated PDF report as
 * an attachment using the configured Nodemailer transport.
 */
export async function emailAdminReport(req, res) {
  const { targetEmail, pdfBase64 } = req.body ?? {};

  if (typeof targetEmail !== 'string' || !EMAIL_REGEX.test(targetEmail.trim())) {
    throw ApiError.badRequest('Please provide a valid targetEmail address');
  }
  if (typeof pdfBase64 !== 'string' || !pdfBase64.trim()) {
    throw ApiError.badRequest('pdfBase64 is required');
  }

  try {
    await sendActivityReportEmail({
      to: targetEmail.trim(),
      pdfBase64: pdfBase64.trim(),
    });
  } catch (err) {
    console.error('📧 Failed to send admin PDF report:', err);
    throw new ApiError(502, 'Could not send the report email. Please check your Resend configuration.');
  }

  res.json({
    success: true,
    message: `PDF report sent to ${targetEmail.trim()}`,
  });
}

