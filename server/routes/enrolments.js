const router = require('express').Router();
const { pool } = require('../db');

// CREATE
router.post('/', async (req, res, next) => {
  try {
    const { class_offering_id, student_id, enrolment_status } = req.body;
    const [r] = await pool.execute(
      `INSERT INTO enrolment (class_offering_id, student_id, enrolment_status)
       VALUES (?, ?, COALESCE(?, 'Active'))`,
      [class_offering_id, student_id, enrolment_status ?? null]
    );
    const [rows] = await pool.execute(
      `SELECT e.*, s.cohort, p.full_name, p.email, co.class_group, co.class_type, c.course_name, t.term_label
       FROM enrolment e
       JOIN student s ON s.student_id = e.student_id
       JOIN person  p ON p.person_id = s.person_id
       JOIN class_offering co ON co.class_offering_id = e.class_offering_id
       JOIN course c ON c.course_code = co.course_code
       JOIN term   t ON t.term_id = co.term_id
       WHERE e.enrolment_id = ?`,
      [r.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// READ
router.get('/', async (req, res, next) => {
  try {
    const { class_offering_id, student_id } = req.query;
    let sql = `
      SELECT e.*, s.cohort, p.full_name, p.email, co.class_group, co.class_type, c.course_name, t.term_label
      FROM enrolment e
      JOIN student s ON s.student_id = e.student_id
      JOIN person  p ON p.person_id = s.person_id
      JOIN class_offering co ON co.class_offering_id = e.class_offering_id
      JOIN course c ON c.course_code = co.course_code
      JOIN term   t ON t.term_id = co.term_id
      WHERE 1=1`;
    const params = [];
    if (class_offering_id) { sql += ` AND e.class_offering_id = ?`; params.push(class_offering_id); }
    if (student_id) { sql += ` AND e.student_id = ?`; params.push(student_id); }
    sql += ` ORDER BY e.enrolment_id DESC`;

    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// UPDATE status
router.put('/:enrolment_id', async (req, res, next) => {
  try {
    const { enrolment_id } = req.params;
    const { enrolment_status } = req.body;
    const [r] = await pool.execute(
      `UPDATE enrolment SET enrolment_status = ? WHERE enrolment_id = ?`,
      [enrolment_status, enrolment_id]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    const [rows] = await pool.execute(`SELECT * FROM enrolment WHERE enrolment_id = ?`, [enrolment_id]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:enrolment_id', async (req, res, next) => {
  try {
    const { enrolment_id } = req.params;
    const [r] = await pool.execute(`DELETE FROM enrolment WHERE enrolment_id = ?`, [enrolment_id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
