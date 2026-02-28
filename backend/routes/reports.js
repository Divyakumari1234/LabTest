// backend/routes/reports.js
import express from 'express';
import mongoose from 'mongoose';
import Report from '../models/Report.js';

const router = express.Router();

// Helper to check if MongoDB is connected
const isMongoConnected = () => mongoose?.connection?.readyState === 1;

router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection
    if (!isMongoConnected()) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB is not connected. Please check your database connection.',
        items: [],
        total: 0,
        page: Number(req.query.page || 1),
        pages: 0
      });
    }

    const {
      q = '',
      status,
      from,
      to,
      page = 1,
      limit = 100,
    } = req.query;

    const filter = {};

    // Search filter
    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [
        { firstName: re },
        { lastName: re },
        { regNo: re },
        { sampleId: re },
        { refBy: re },
        { mobile: re },
      ];
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (from || to) {
      filter.dt = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        filter.dt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.dt.$lte = toDate;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Report.find(filter)
        .sort({ dt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Report.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ 
      error: 'Failed to fetch reports',
      message: err?.message || 'An unexpected error occurred while fetching reports',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/* ------------------------------ Get Single Report ------------------------------ */
router.get('/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB is not connected. Please check your database connection.'
      });
    }

    const doc = await Report.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Report not found' });
    res.json(doc);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid report ID',
        message: `The provided ID "${req.params.id}" is not a valid MongoDB ObjectId`,
        received: req.params.id
      });
    }
    console.error('Error fetching report:', err);
    res.status(400).json({ 
      error: 'Failed to fetch report',
      message: err?.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/* ------------------------------ Create Report ------------------------------ */
/**
 * POST /api/reports
 * Body: { sampleId, firstName, lastName, age, gender, mobile, refBy, regNo, dt, status, collectedBy, sampleType, address, tests }
 */
router.post('/', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB is not connected. Please check your database connection.'
      });
    }

    const {
      sampleId,
      firstName,
      lastName,
      age,
      gender,
      mobile,
      refBy,
      regNo,
      dt,
      status = 'new',
      collectedBy,
      sampleType,
      address,
      tests = [],
      results = {},
    } = req.body;

    // Detailed validation
    const missingFields = [];
    if (!sampleId) missingFields.push('sampleId');
    if (!firstName) missingFields.push('firstName');
    if (!lastName) missingFields.push('lastName');
    if (!age) missingFields.push('age');
    if (!gender) missingFields.push('gender');
    if (!mobile) missingFields.push('mobile');
    if (!refBy) missingFields.push('refBy');
    if (!regNo) missingFields.push('regNo');
    if (!dt) missingFields.push('dt');
    if (!collectedBy) missingFields.push('collectedBy');
    if (!sampleType) missingFields.push('sampleType');
    if (!address) missingFields.push('address');

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: `The following fields are required: ${missingFields.join(', ')}`,
        missingFields 
      });
    }

    // Validate gender enum
    if (!['Male', 'Female', 'Other'].includes(gender)) {
      return res.status(400).json({ 
        error: 'Invalid gender value',
        message: `Gender must be one of: Male, Female, Other. Received: ${gender}`,
        received: gender,
        allowed: ['Male', 'Female', 'Other']
      });
    }

    // Validate status enum
    if (status && !['new', 'inprogress', 'final', 'signed'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        message: `Status must be one of: new, inprogress, final, signed. Received: ${status}`,
        received: status,
        allowed: ['new', 'inprogress', 'final', 'signed']
      });
    }

    // Validate date format
    if (dt && isNaN(new Date(dt).getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        message: `Date (dt) must be a valid ISO date string. Received: ${dt}`,
        received: dt
      });
    }

    // Check if regNo already exists
    const existing = await Report.findOne({ regNo }).lean();
    if (existing) {
      return res.status(400).json({ error: 'Registration number already exists' });
    }

    // Convert results object to plain object (MongoDB handles it as Map internally)
    const resultsObj = {};
    if (results && typeof results === 'object' && !Array.isArray(results)) {
      Object.entries(results).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          resultsObj[key] = String(value);
        }
      });
    }

    const created = await Report.create({
      sampleId,
      firstName,
      lastName,
      age,
      gender,
      mobile,
      refBy,
      regNo,
      dt: new Date(dt),
      status,
      collectedBy,
      sampleType,
      address,
      tests: Array.isArray(tests) ? tests : [],
      results: resultsObj,
    });

    res.status(201).json(created);
  } catch (err) {
    // Handle duplicate key error (MongoDB unique constraint)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ 
        error: 'Duplicate entry',
        message: `A report with this ${field} already exists`,
        field: field,
        value: err.keyValue?.[field]
      });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors || {}).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'One or more fields failed validation',
        validationErrors
      });
    }

    // Handle other errors
    console.error('Error creating report:', err);
    res.status(400).json({ 
      error: 'Failed to create report',
      message: err?.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/* ------------------------------ Update Report ------------------------------ */
/**
 * PUT /api/reports/:id
 * Body: { ...fields to update }
 */
router.put('/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB is not connected. Please check your database connection.'
      });
    }

    const updateData = { ...req.body };

    // Convert dt to Date if provided
    if (updateData.dt) {
      updateData.dt = new Date(updateData.dt);
    }

    // Convert results object to plain object format if provided
    if (updateData.results && typeof updateData.results === 'object' && !Array.isArray(updateData.results)) {
      const resultsObj = {};
      Object.entries(updateData.results).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          resultsObj[key] = String(value);
        }
      });
      updateData.results = resultsObj;
    }

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(updated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid report ID',
        message: `The provided ID "${req.params.id}" is not a valid MongoDB ObjectId`,
        received: req.params.id
      });
    }

    if (err.name === 'ValidationError') {
      const validationErrors = {};
      Object.keys(err.errors || {}).forEach(key => {
        validationErrors[key] = err.errors[key].message;
      });
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'One or more fields failed validation',
        validationErrors
      });
    }

    console.error('Error updating report:', err);
    res.status(400).json({ 
      error: 'Failed to update report',
      message: err?.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

/* ------------------------------ Delete Report ------------------------------ */
router.delete('/:id', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({
        error: 'Database not connected',
        message: 'MongoDB is not connected. Please check your database connection.'
      });
    }

    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json({ ok: true, message: 'Report deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid report ID',
        message: `The provided ID "${req.params.id}" is not a valid MongoDB ObjectId`,
        received: req.params.id
      });
    }
    console.error('Error deleting report:', err);
    res.status(400).json({ 
      error: 'Failed to delete report',
      message: err?.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;
