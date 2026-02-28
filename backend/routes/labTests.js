
import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const jsonDataPath = join(__dirname, '../data/labtests_full.json'); 

let jsonData = [];


try {
  const fileContent = readFileSync(jsonDataPath, 'utf-8');
  jsonData = JSON.parse(fileContent);
  if (!Array.isArray(jsonData)) {
    console.error('[labTests] JSON file does not contain an array');
    jsonData = [];
  } else {
    console.log(`[labTests] ✅ Loaded ${jsonData.length} items from JSON file: ${jsonDataPath}`);
  }
} catch (err) {
  console.error(`[labTests] ❌ Failed to load JSON file from ${jsonDataPath}`);
  console.error(`[labTests] Error: ${err.message}`);
  jsonData = [];
}

const router = express.Router();


const LIB16 = [
  { name: 'Troponin T', category: 'Biochemistry' },
  { name: 'eGFR', category: 'Biochemistry' },
  { name: 'eGFR Category', category: 'Biochemistry' },
  { name: 'Sickling cell test, Blood', category: 'Haematology' },
  { name: 'Oral Glucose Challenge Test', category: 'Biochemistry' },
  { name: 'Helicobacter Pylori Antigen', category: 'Microbiology' },
  { name: 'Chikungunya IgM & IgG', category: 'Serology & Immunology' },
  { name: 'Procalcitonin (PCT), Serum', category: 'Serology & Immunology' },
  { name: 'Scrub Typhus', category: 'Serology & Immunology' },
  { name: 'Adenosine Deaminase (ADA)', category: 'Biochemistry' },
  { name: 'Hemoglobin HPLC/Electrophoresis (HPLC)', category: 'Haematology' },
  { name: 'Medical Certificate', category: 'Miscellaneous' },
  { name: 'Tissue Transglutaminase (tTG) Antibody, IgA, Serum', category: 'Serology & Immunology' },
  { name: 'Histo - Carcinoma of the Breast', category: 'Histopathology' },
  { name: 'Mentzer Index', category: 'Haematology' },
  { name: 'Green and King Index', category: 'Haematology' },
].map((r, i) => ({ _id: `lib${i + 1}`, ...r })); 


router.get('/', async (req, res) => {
  try {
    if (!jsonData || jsonData.length === 0) {
      try {
        const fileContent = readFileSync(jsonDataPath, 'utf-8');
        jsonData = JSON.parse(fileContent);
        if (!Array.isArray(jsonData)) {
          console.error('[labTests] JSON file does not contain an array');
          jsonData = [];
        } else {
          console.log(`[labTests] ✅ Reloaded ${jsonData.length} items from JSON file`);
        }
      } catch (reloadErr) {
        console.error(`[labTests] ❌ Failed to reload JSON file: ${reloadErr.message}`);
      }
    }

    if (!jsonData || jsonData.length === 0) {
      return res.status(200).json({
        items: [],
        total: 0,
        page: 1,
        pages: 0,
        message: 'No data available. JSON file is empty or not loaded properly.'
      });
    }

    const {
      q = '',
      category,
      page = 1,
      limit = 20,
      sort = 'order',
      fields,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(10000, parseInt(limit, 10) || 20));
    const term = String(q || '').trim().toLowerCase();
    const cat = (category || '').trim();

    let items = [];
    try {
      items = jsonData
        .filter(d => d != null) 
        .map((d, idx) => {
          try {
            const order = Number(d.order ?? d.serialNo ?? idx + 1) || (idx + 1);
            const name = String(d.name ?? d.testName ?? '').trim();
            const shortName = String(d.shortName ?? d.short_name ?? '').trim();
            const category = (d.category && String(d.category).trim()) ? String(d.category).trim() : 'Others';
            return {
              _id: d._id || String(d.id || `json-${idx}`),
              order,
              name,
              shortName,
              category,
              price: Number(d.price || 0),
            };
          } catch (itemErr) {
            console.warn(`[labTests] Error processing item at index ${idx}:`, itemErr.message);
            return null;
          }
        })
        .filter(item => item != null && item.name); 
    } catch (mapErr) {
      console.error('[labTests] Error mapping data:', mapErr);
      throw new Error(`Failed to process test data: ${mapErr.message}`);
    }

    // Apply search filter
    if (term) {
      items = items.filter(x =>
        String(x.order || '').includes(term) ||
        (x.name || '').toLowerCase().includes(term) ||
        (x.shortName || '').toLowerCase().includes(term) ||
        (x.category || '').toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (cat) {
      items = items.filter(x => x.category === cat);
    }

    // Apply sorting
    try {
      if (sort === 'order' || !sort) {
        items.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      } else if (sort === '-order') {
        items.sort((a, b) => (Number(b.order) || 0) - (Number(a.order) || 0));
      }
    } catch (sortErr) {
      console.warn('[labTests] Error sorting items:', sortErr.message);
    }

    const total = items.length;
    const start = (pageNum - 1) * limitNum;
    const pagedItems = items.slice(start, start + limitNum);

    // Apply field projection
    let finalItems = pagedItems;
    if (fields) {
      try {
        const fieldList = String(fields).split(',').map(s => s.trim()).filter(Boolean);
        finalItems = pagedItems.map(item => {
          const projected = { _id: item._id };
          fieldList.forEach(f => {
            if (item[f] !== undefined) projected[f] = item[f];
          });
          return projected;
        });
      } catch (projectErr) {
        console.warn('[labTests] Error projecting fields:', projectErr.message);
        finalItems = pagedItems; 
      }
    }

    res.json({
      items: finalItems,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    console.error('[labTests] Error in GET /api/lab-tests:', err);
    console.error('[labTests] Error stack:', err.stack);
    res.status(500).json({
      error: 'Failed to fetch lab tests',
      message: err?.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});


router.get('/meta/categories/list', async (_req, res) => {
  try {
    const mongoReady = mongoose?.connection?.readyState === 1;

    if (mongoReady) {
      const agg = await User.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $project: { _id: 0, category: '$_id', count: 1 } },
        { $sort: { category: 1 } },
      ]);
      return res.json(agg);
    }

    
    const map = new Map();
    jsonData.forEach((d) => {
      const cat = (d.category && String(d.category).trim()) ? String(d.category).trim() : 'Others';
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    const out = Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => a.category.localeCompare(b.category));

    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to list categories' });
  }
});


router.get('/library', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '16', 10)));
  const q = (req.query.q || '').trim().toLowerCase();
  const category = (req.query.category || '').trim();

  let filtered = LIB16;
  if (q) {
    filtered = filtered.filter(
      x =>
        x.name.toLowerCase().includes(q) ||
        (x.category || '').toLowerCase().includes(q),
    );
  }
  if (category) filtered = filtered.filter(x => x.category === category);

  const total = filtered.length;
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  res.json({ items, total, page, limit });
});


router.post('/', async (req, res) => {
  try {
    const { name, shortName, category, price, order } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'Test name is required'
      });
    }

    
    const newTest = {
      _id: `test-${Date.now()}`,
      name: String(name).trim(),
      shortName: String(shortName || '').trim(),
      category: String(category || 'Others').trim(),
      price: Number(price || 0),
      order: Number(order || jsonData.length + 1),
    };

    res.status(201).json(newTest);
  } catch (err) {
    console.error('Error creating lab test:', err);
    res.status(500).json({
      error: 'Failed to create lab test',
      message: err?.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

export default router;
