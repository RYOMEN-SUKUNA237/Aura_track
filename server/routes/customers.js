const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { generateCustomerId } = require('../utils/generators');

const router = express.Router();

// GET /api/customers — List all customers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, search, type, page = 1, limit = 50 } = req.query;
    let query = 'SELECT * FROM customers WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND status = $${params.length}`;
      countQuery += ` AND status = $${params.length}`;
    }

    if (type && type !== 'all') {
      params.push(type);
      query += ` AND type = $${params.length}`;
      countQuery += ` AND type = $${params.length}`;
    }

    if (search) {
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
      const n = params.length;
      query += ` AND (contact_name ILIKE $${n-4} OR company_name ILIKE $${n-3} OR customer_id ILIKE $${n-2} OR email ILIKE $${n-1} OR phone ILIKE $${n})`;
      countQuery += ` AND (contact_name ILIKE $${n-4} OR company_name ILIKE $${n-3} OR customer_id ILIKE $${n-2} OR email ILIKE $${n-1} OR phone ILIKE $${n})`;
    }

    const { rows: countRows } = await pool.query(countQuery, params);
    const total = parseInt(countRows[0].total);

    query += ' ORDER BY created_at DESC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows: customers } = await pool.query(query, params);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('List customers error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/customers/:id — Get single customer
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id::text = $1 OR customer_id = $1', [req.params.id]);
    const customer = rows[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    // Get customer shipments
    const { rows: shipments } = await pool.query('SELECT * FROM shipments WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 20', [customer.customer_id]);

    res.json({ customer, shipments });
  } catch (err) {
    console.error('Get customer error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/customers — Register new customer
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { contact_name, company_name, email, phone, address, city, state, country, postal_code, type, notes } = req.body;

    if (!contact_name || !email || !phone) {
      return res.status(400).json({ error: 'contact_name, email, and phone are required.' });
    }

    const { rows: existing } = await pool.query('SELECT id FROM customers WHERE email = $1', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'A customer with this email already exists.' });
    }

    // Generate unique customer ID
    let customerId;
    let attempts = 0;
    do {
      customerId = generateCustomerId();
      const { rows: dup } = await pool.query('SELECT id FROM customers WHERE customer_id = $1', [customerId]);
      if (dup.length === 0) break;
      attempts++;
    } while (attempts < 10);

    const { rows: inserted } = await pool.query(`
      INSERT INTO customers (customer_id, contact_name, company_name, email, phone, address, city, state, country, postal_code, type, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *
    `, [
      customerId, contact_name, company_name || null, email, phone,
      address || null, city || null, state || null, country || 'US',
      postal_code || null, type || 'individual', notes || null
    ]);

    const customer = inserted[0];

    await pool.query('INSERT INTO notifications (title, message, type) VALUES ($1, $2, $3)', [
      'New Customer Registered',
      `${contact_name} (${customerId}) has been registered.`,
      'info'
    ]);

    res.status(201).json({ customer });
  } catch (err) {
    console.error('Register customer error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/customers/:id — Update customer
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id::text = $1 OR customer_id = $1', [req.params.id]);
    const customer = rows[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    const { contact_name, company_name, email, phone, address, city, state, country, postal_code, type, status, notes } = req.body;

    await pool.query(`
      UPDATE customers SET
        contact_name = COALESCE($1, contact_name),
        company_name = COALESCE($2, company_name),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        country = COALESCE($8, country),
        postal_code = COALESCE($9, postal_code),
        type = COALESCE($10, type),
        status = COALESCE($11, status),
        notes = COALESCE($12, notes)
      WHERE id = $13
    `, [
      contact_name || null, company_name || null, email || null, phone || null,
      address || null, city || null, state || null, country || null,
      postal_code || null, type || null, status || null, notes || null,
      customer.id
    ]);

    const { rows: updated } = await pool.query('SELECT * FROM customers WHERE id = $1', [customer.id]);
    res.json({ customer: updated[0] });
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/customers/:id — Delete customer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id::text = $1 OR customer_id = $1', [req.params.id]);
    const customer = rows[0];
    if (!customer) return res.status(404).json({ error: 'Customer not found.' });

    await pool.query('DELETE FROM customers WHERE id = $1', [customer.id]);
    res.json({ message: 'Customer deleted successfully.' });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
