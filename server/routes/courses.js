const router = require('express').Router();
const { pool } = require('../db');

// CREATE
router.post('/', async (req, res, next) => {
  try {
    const { course_code, course_name, credit, course_description } = req.body;
    await pool.execute(
      `INSERT INTO course (course_code, course_name, credit, course_description)
       VALUES (?, ?, ?, ?)`,
      [course_code, course_name, credit, course_description ?? null]
    );
    const [rows] = await pool.execute(`SELECT * FROM course WHERE course_code = ?`, [course_code]);
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// READ (list + optional search)
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query; // optional search by name/code
    let sql = `SELECT * FROM course`;
    let params = [];
    if (q) {
      sql += ` WHERE course_code LIKE ? OR course_name LIKE ?`;
      params = [`%${q}%`, `%${q}%`];
    }
    sql += ` ORDER BY course_code`;
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// READ one
router.get('/:course_code', async (req, res, next) => {
  try {
    const { course_code } = req.params;
    const [rows] = await pool.execute(`SELECT * FROM course WHERE course_code = ?`, [course_code]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// UPDATE
router.put('/:course_code', async (req, res, next) => {
  try {
    const { course_code } = req.params;
    const { course_name, credit, course_description } = req.body;
    const [result] = await pool.execute(
      `UPDATE course SET course_name = ?, credit = ?, course_description = ?
       WHERE course_code = ?`,
      [course_name, credit, course_description ?? null, course_code]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.execute(`SELECT * FROM course WHERE course_code = ?`, [course_code]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:course_code', async (req, res, next) => {
  try {
    const { course_code } = req.params;
    const [result] = await pool.execute(`DELETE FROM course WHERE course_code = ?`, [course_code]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
