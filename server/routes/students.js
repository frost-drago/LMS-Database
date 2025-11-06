const router = require('express').Router();
const { pool } = require('../db');

// CREATE student (also create person in one shot if needed)
router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { full_name, email, student_id, cohort } = req.body;

    await conn.beginTransaction();
    const [p] = await conn.execute(
      `INSERT INTO person (full_name, email) VALUES (?, ?)`,
      [full_name, email]
    );
    const person_id = p.insertId;
    await conn.execute(
      `INSERT INTO student (person_id, student_id, cohort) VALUES (?, ?, ?)`,
      [person_id, student_id, cohort ?? null]
    );

    await conn.commit();
    const [rows] = await pool.execute(
      `SELECT s.person_id, s.student_id, s.cohort, pe.full_name, pe.email
       FROM student s JOIN person pe ON pe.person_id = s.person_id
       WHERE s.student_id = ?`,
      [student_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// READ students (join person)
router.get('/', async (_req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT s.person_id, s.student_id, s.cohort, p.full_name, p.email
       FROM student s JOIN person p ON p.person_id = s.person_id
       ORDER BY s.student_id`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// UPDATE (can update both person + student)
router.put('/:student_id', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { student_id } = req.params;
    const { full_name, email, cohort } = req.body;

    await conn.beginTransaction();
    const [sRows] = await conn.execute(`SELECT person_id FROM student WHERE student_id = ?`, [student_id]);
    if (!sRows.length) { await conn.rollback(); return res.status(404).json({ error: 'Not found' }); }
    const person_id = sRows[0].person_id;

    if (full_name != null || email != null) {
      await conn.execute(
        `UPDATE person SET full_name = COALESCE(?, full_name), email = COALESCE(?, email)
         WHERE person_id = ?`,
        [full_name ?? null, email ?? null, person_id]
      );
    }
    if (cohort != null) {
      await conn.execute(`UPDATE student SET cohort = ? WHERE student_id = ?`, [cohort, student_id]);
    }
    await conn.commit();

    const [rows] = await pool.execute(
      `SELECT s.person_id, s.student_id, s.cohort, p.full_name, p.email
       FROM student s JOIN person p ON p.person_id = s.person_id
       WHERE s.student_id = ?`,
      [student_id]
    );
    res.json(rows[0]);
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// DELETE (will be blocked by FK if referenced elsewhere)
router.delete('/:student_id', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { student_id } = req.params;
    await conn.beginTransaction();

    const [sRows] = await conn.execute(`SELECT person_id FROM student WHERE student_id = ?`, [student_id]);
    if (!sRows.length) { await conn.rollback(); return res.status(404).json({ error: 'Not found' }); }
    const person_id = sRows[0].person_id;

    await conn.execute(`DELETE FROM student WHERE student_id = ?`, [student_id]);
    await conn.execute(`DELETE FROM person WHERE person_id = ?`, [person_id]); // RESTRICT if still referenced
    await conn.commit();
    res.status(204).end();
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

module.exports = router;
