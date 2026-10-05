import express from 'express';
import mongoose from 'mongoose';
import { Meeting, Lead, Client, Employee, User } from '../models/index.js';
import { logAudit, logLeadActivity, createNotification } from '../db/helpers.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// List Meetings with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { lead_id, client_id, status, upcoming_only, date } = req.query;

    const query = {};

    if (req.user.role_name === 'sales' && req.employee) {
      query.$or = [
        { assigned_employee_id: req.employee._id },
        { created_by: req.user._id }
      ];
    }

    if (lead_id && mongoose.Types.ObjectId.isValid(lead_id)) {
      query.lead_id = lead_id;
    }
    if (client_id && mongoose.Types.ObjectId.isValid(client_id)) {
      query.client_id = client_id;
    }
    if (status) {
      query.status = status;
    }
    if (date) {
      const d = new Date(date);
      const nextD = new Date(date);
      nextD.setDate(nextD.getDate() + 1);
      query.meeting_date = { $gte: d, $lt: nextD };
    }
    if (upcoming_only === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.meeting_date = { $gte: today };
      query.status = 'SCHEDULED';
    }

    const meetings = await Meeting.find(query)
      .populate('lead_id')
      .populate('client_id')
      .populate('assigned_employee_id')
      .populate('created_by')
      .sort({ meeting_date: 1, meeting_time: 1, created_at: -1 });

    const formatted = meetings.map(m => {
      const l = m.lead_id;
      const c = m.client_id;
      const e = m.assigned_employee_id;
      const u = m.created_by;

      return {
        ...m.toJSON(),
        lead_company_name: l?.company_name || '',
        lead_contact_person: l?.contact_person || '',
        lead_phone: l?.phone || '',
        lead_code: l?.lead_code || '',
        client_company_name: c?.company_name || '',
        client_code: c?.client_code || '',
        assigned_employee_name: e ? `${e.first_name} ${e.last_name}` : '',
        created_by_username: u?.username || ''
      };
    });

    res.json({ meetings: formatted });
  } catch (err) {
    console.error('Error listing meetings:', err);
    res.status(500).json({ error: 'Failed to retrieve meetings list.' });
  }
});

// Schedule Meeting
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      lead_id, client_id, title, meeting_date, meeting_time, meeting_type,
      meeting_link, location, participants, agenda, notes, reminder, assigned_employee_id
    } = req.body;

    if (!title || !meeting_date || !meeting_time) {
      return res.status(400).json({ error: 'Title, date, and time are required to schedule a meeting.' });
    }

    const assignedEmpId = (assigned_employee_id && mongoose.Types.ObjectId.isValid(assigned_employee_id))
      ? assigned_employee_id
      : (req.employee ? req.employee._id : null);

    const newMeeting = await Meeting.create({
      lead_id: lead_id && mongoose.Types.ObjectId.isValid(lead_id) ? lead_id : null,
      client_id: client_id && mongoose.Types.ObjectId.isValid(client_id) ? client_id : null,
      title,
      meeting_date: new Date(meeting_date),
      meeting_time,
      meeting_type: meeting_type || 'Video Call',
      meeting_link: meeting_link || '',
      location: location || '',
      participants: Array.isArray(participants) ? participants : (participants ? [participants] : []),
      agenda: agenda || '',
      notes: notes || '',
      reminder: reminder !== undefined ? Boolean(reminder) : true,
      status: 'SCHEDULED',
      assigned_employee_id: assignedEmpId,
      created_by: req.user._id
    });

    const meetingId = newMeeting._id.toString();

    // If lead associated, log activity and update status
    if (newMeeting.lead_id) {
      await logLeadActivity({
        leadId: newMeeting.lead_id,
        activityType: 'MEETING_SCHEDULED',
        title: `Meeting Scheduled: ${title}`,
        description: `${meeting_type || 'Video Call'} scheduled for ${meeting_date} at ${meeting_time}. Agenda: ${agenda || 'Discovery & Pitch'}`,
        performedBy: assignedEmpId
      });

      const lead = await Lead.findById(newMeeting.lead_id);
      if (lead && (lead.status === 'NEW' || lead.status === 'CONTACTED')) {
        lead.status = 'MEETING';
        await lead.save();
      }
    }

    // Create notification for assigned employee if different from creator
    if (assignedEmpId && (!req.employee || req.employee._id.toString() !== assignedEmpId.toString())) {
      const empUser = await Employee.findById(assignedEmpId);
      if (empUser && empUser.user_id) {
        await createNotification({
          userId: empUser.user_id,
          type: 'MEETING_SCHEDULED',
          title: 'New Meeting Scheduled',
          message: `${title} has been scheduled for ${meeting_date} at ${meeting_time}.`,
          relatedEntity: 'meetings',
          relatedEntityId: newMeeting._id
        });
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'MEETING_SCHEDULED',
      entity: 'meetings',
      entityId: newMeeting._id,
      newValue: { title, meeting_date, meeting_time, lead_id },
      ip: req.ip
    });

    res.status(201).json({ message: 'Meeting scheduled successfully', meeting: newMeeting.toJSON() });
  } catch (err) {
    console.error('Error scheduling meeting:', err);
    res.status(500).json({ error: 'Failed to schedule meeting.' });
  }
});

// Update Meeting Status / Reschedule
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const {
      title, meeting_date, meeting_time, meeting_type, meeting_link,
      location, participants, agenda, notes, status
    } = req.body;

    const oldStatus = meeting.status;

    if (title !== undefined) meeting.title = title;
    if (meeting_date !== undefined) meeting.meeting_date = new Date(meeting_date);
    if (meeting_time !== undefined) meeting.meeting_time = meeting_time;
    if (meeting_type !== undefined) meeting.meeting_type = meeting_type;
    if (meeting_link !== undefined) meeting.meeting_link = meeting_link;
    if (location !== undefined) meeting.location = location;
    if (participants !== undefined) meeting.participants = Array.isArray(participants) ? participants : [participants];
    if (agenda !== undefined) meeting.agenda = agenda;
    if (notes !== undefined) meeting.notes = notes;
    if (status !== undefined) meeting.status = status;

    await meeting.save();

    if (status && status !== oldStatus) {
      if (meeting.lead_id) {
        await logLeadActivity({
          leadId: meeting.lead_id,
          activityType: status === 'COMPLETED' ? 'MEETING_COMPLETED' : 'MEETING_UPDATED',
          title: status === 'COMPLETED' ? `Meeting Completed: ${meeting.title}` : `Meeting Status: ${status}`,
          description: `Meeting status changed from ${oldStatus} to ${status}. Notes: ${notes || meeting.notes || ''}`,
          performedBy: req.employee ? req.employee._id : null
        });
      }

      await logAudit({
        userId: req.user.id,
        action: 'MEETING_STATUS_CHANGED',
        entity: 'meetings',
        entityId: meeting._id,
        oldValue: { status: oldStatus },
        newValue: { status },
        ip: req.ip
      });
    }

    res.json({ message: 'Meeting updated successfully', meeting: meeting.toJSON() });
  } catch (err) {
    console.error('Error updating meeting:', err);
    res.status(500).json({ error: 'Failed to update meeting.' });
  }
});

export default router;
