// routes/instructors.js
const router = require('express').Router();
const { pool } = require('../db');

/**
 * CREATE instructor
 * Body: { full_name, email, instructor_id }
 * - Creates person, then instructor (transaction).
 */
router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { full_name, email, instructor_id } = req.body;
    if (!full_name || !email || !instructor_id) {
      return res.status(400).json({ error: 'full_name, email, instructor_id are required' });
    }

    await conn.beginTransaction();
    const [p] = await conn.execute(
      `INSERT INTO person (full_name, email) VALUES (?, ?)`,
      [full_name, email]
    );
    const person_id = p.insertId;

    await conn.execute(
      `INSERT INTO instructor (person_id, instructor_id) VALUES (?, ?)`,
      [person_id, instructor_id]
    );

    await conn.commit();

    const [rows] = await pool.execute(
      `SELECT i.person_id, i.instructor_id, p.full_name, p.email
       FROM instructor i
       JOIN person p ON p.person_id = i.person_id
       WHERE i.instructor_id = ?`,
      [instructor_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

/**
 * READ instructors (list)
 * Query: optional ?q= (search name/email/id)
 */
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT i.person_id, i.instructor_id, p.full_name, p.email
      FROM instructor i
      JOIN person p ON p.person_id = i.person_id
      WHERE 1=1`;
    const params = [];

    if (q) {
      sql += ` AND (p.full_name LIKE ? OR p.email LIKE ? OR i.instructor_id LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY i.instructor_id`;
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

/**
 * READ one instructor by instructor_id
 */
router.get('/:instructor_id', async (req, res, next) => {
  try {
    const { instructor_id } = req.params;
    const [rows] = await pool.execute(
      `SELECT i.person_id, i.instructor_id, p.full_name, p.email
       FROM instructor i
       JOIN person p ON p.person_id = i.person_id
       WHERE i.instructor_id = ?`,
      [instructor_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

/**
 * UPDATE instructor
 * Params: :instructor_id (current)
 * Body: { full_name?, email?, new_instructor_id? }
 * - Can update person data and optionally change instructor_id (ON UPDATE CASCADE handles teaching_assignment).
 */
router.put('/:instructor_id', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { instructor_id } = req.params;
    const { full_name, email, new_instructor_id } = req.body;

    await conn.beginTransaction();

    // Find person_id first
    const [iRows] = await conn.execute(
      `SELECT person_id FROM instructor WHERE instructor_id = ?`,
      [instructor_id]
    );
    if (!iRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Not found' });
    }
    const person_id = iRows[0].person_id;

    // Update person if provided
    if (full_name != null || email != null) {
      await conn.execute(
        `UPDATE person
         SET full_name = COALESCE(?, full_name),
             email     = COALESCE(?, email)
         WHERE person_id = ?`,
        [full_name ?? null, email ?? null, person_id]
      );
    }

    // Optionally change instructor_id (will cascade to teaching_assignment via FK ON UPDATE CASCADE)
    if (new_instructor_id != null && new_instructor_id !== instructor_id) {
      await conn.execute(
        `UPDATE instructor SET instructor_id = ? WHERE person_id = ?`,
        [new_instructor_id, person_id]
      );
    }

    await conn.commit();

    const finalId = new_instructor_id ?? instructor_id;
    const [rows] = await pool.execute(
      `SELECT i.person_id, i.instructor_id, p.full_name, p.email
       FROM instructor i
       JOIN person p ON p.person_id = i.person_id
       WHERE i.instructor_id = ?`,
      [finalId]
    );
    res.json(rows[0]);
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

/**
 * DELETE instructor by instructor_id
 * - Deletes instructor row, then deletes person row.
 * - Will fail with FK RESTRICT if there are teaching assignments.
 */
router.delete('/:instructor_id', async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { instructor_id } = req.params;

    await conn.beginTransaction();

    // Get person_id
    const [iRows] = await conn.execute(
      `SELECT person_id FROM instructor WHERE instructor_id = ?`,
      [instructor_id]
    );
    if (!iRows.length) {
      await conn.rollback();
      return res.status(404).json({ error: 'Not found' });
    }
    const person_id = iRows[0].person_id;

    // Delete instructor (may fail if referenced by teaching_assignment due to RESTRICT)
    await conn.execute(`DELETE FROM instructor WHERE instructor_id = ?`, [instructor_id]);

    // Now delete person (RESTRICT if somehow still referenced)
    await conn.execute(`DELETE FROM person WHERE person_id = ?`, [person_id]);

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
