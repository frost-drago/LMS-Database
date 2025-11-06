const router = require('express').Router();
const { pool } = require('../db');

// CREATE person
router.post('/', async (req, res, next) => {
  try {
    const { full_name, email } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO person (full_name, email) VALUES (?, ?)`,
      [full_name, email]
    );
    const [rows] = await pool.execute(`SELECT * FROM person WHERE person_id = ?`, [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// READ list
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(`SELECT * FROM person ORDER BY person_id DESC`);
    res.json(rows);
  } catch (e) { next(e); }
});

// READ one
router.get('/:person_id', async (req, res, next) => {
  try {
    const { person_id } = req.params;
    const [rows] = await pool.execute(`SELECT * FROM person WHERE person_id = ?`, [person_id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// UPDATE
router.put('/:person_id', async (req, res, next) => {
  try {
    const { person_id } = req.params;
    const { full_name, email } = req.body;
    const [result] = await pool.execute(
      `UPDATE person SET full_name = ?, email = ? WHERE person_id = ?`,
      [full_name, email, person_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.execute(`SELECT * FROM person WHERE person_id = ?`, [person_id]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// DELETE (will fail if referenced due to FK RESTRICT)
router.delete('/:person_id', async (req, res, next) => {
  try {
    const { person_id } = req.params;
    const [result] = await pool.execute(`DELETE FROM person WHERE person_id = ?`, [person_id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
