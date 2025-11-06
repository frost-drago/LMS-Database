const router = require('express').Router();
const { pool } = require('../db');

router.post('/', async (req, res, next) => {
  try {
    const { start_date, end_date, term_label } = req.body;
    const [r] = await pool.execute(
      `INSERT INTO term (start_date, end_date, term_label) VALUES (?, ?, ?)`,
      [start_date, end_date, term_label]
    );
    const [rows] = await pool.execute(`SELECT * FROM term WHERE term_id = ?`, [r.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM term ORDER BY term_id DESC`);
    res.json(rows);
  } catch (e) { next(e); }
});

router.put('/:term_id', async (req, res, next) => {
  try {
    const { term_id } = req.params;
    const { start_date, end_date, term_label } = req.body;
    const [r] = await pool.execute(
      `UPDATE term SET start_date = ?, end_date = ?, term_label = ? WHERE term_id = ?`,
      [start_date, end_date, term_label, term_id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.execute(`SELECT * FROM term WHERE term_id = ?`, [term_id]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/:term_id', async (req, res, next) => {
  try {
    const { term_id } = req.params;
    const [r] = await pool.execute(`DELETE FROM term WHERE term_id = ?`, [term_id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
