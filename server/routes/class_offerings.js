const router = require('express').Router();
const { pool } = require('../db');

// CREATE
router.post('/', async (req, res, next) => {
  try {
    const { course_code, term_id, class_group, class_type } = req.body;
    const [r] = await pool.execute(
      `INSERT INTO class_offering (course_code, term_id, class_group, class_type)
       VALUES (?, ?, ?, ?)`,
      [course_code, term_id, class_group, class_type]
    );
    const [rows] = await pool.execute(
      `SELECT co.*, c.course_name, t.term_label
       FROM class_offering co
       JOIN course c ON c.course_code = co.course_code
       JOIN term t   ON t.term_id = co.term_id
       WHERE co.class_offering_id = ?`,
      [r.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// READ (with joins and filters)
router.get('/', async (req, res, next) => {
  try {
    const { term_id, course_code } = req.query;
    let sql = `
      SELECT co.*, c.course_name, t.term_label
      FROM class_offering co
      JOIN course c ON c.course_code = co.course_code
      JOIN term t   ON t.term_id = co.term_id
      WHERE 1=1`;
    const params = [];
    if (term_id) { sql += ` AND co.term_id = ?`; params.push(term_id); }
    if (course_code) { sql += ` AND co.course_code = ?`; params.push(course_code); }
    sql += ` ORDER BY co.class_offering_id DESC`;

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// UPDATE
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { course_code, term_id, class_group, class_type } = req.body;
    const [r] = await pool.execute(
      `UPDATE class_offering SET course_code = ?, term_id = ?, class_group = ?, class_type = ?
       WHERE class_offering_id = ?`,
      [course_code, term_id, class_group, class_type, id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.execute(
      `SELECT co.*, c.course_name, t.term_label
       FROM class_offering co
       JOIN course c ON c.course_code = co.course_code
       JOIN term t   ON t.term_id = co.term_id
       WHERE co.class_offering_id = ?`,
      [id]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [r] = await pool.execute(`DELETE FROM class_offering WHERE class_offering_id = ?`, [id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
