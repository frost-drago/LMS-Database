const router = require('express').Router();
const { pool } = require('../db');

// CREATE
router.post('/', async (req, res, next) => {
    try {
        const { enrolment_id, session_id, assessment_type, score, weight, attendance_status } = req.body;
        const [r] = await pool.execute(
        `INSERT INTO grades_and_attendance
        (enrolment_id, session_id, assessment_type, score, weight, attendance_status)
        VALUES (?, ?, ?, ?, ?, COALESCE(?, 'Not attended'))`,
        [enrolment_id, session_id, assessment_type, score, weight, attendance_status ?? null]
        );
        const [rows] = await pool.execute(`SELECT * FROM grades_and_attendance WHERE record_id = ?`, [r.insertId]);
        res.status(201).json(rows[0]);
    } catch (e) { next(e); }
});

// READ (by enrolment or session)
router.get('/', async (req, res, next) => {
    try {
        const { enrolment_id, session_id } = req.query;
        let sql = `SELECT * FROM grades_and_attendance WHERE 1=1`;
        const params = [];
        if (enrolment_id) { sql += ` AND enrolment_id = ?`; params.push(enrolment_id); }
        if (session_id) { sql += ` AND session_id = ?`; params.push(session_id); }
        sql += ` ORDER BY record_id DESC`;
        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (e) { next(e); }
});

// UPDATE
router.put('/:record_id', async (req, res, next) => {
    try {
        const { record_id } = req.params;
        const { assessment_type, score, weight, attendance_status } = req.body;
        const [r] = await pool.execute(
        `UPDATE grades_and_attendance
        SET assessment_type = COALESCE(?, assessment_type),
            score = COALESCE(?, score),
            weight = COALESCE(?, weight),
            attendance_status = COALESCE(?, attendance_status)
        WHERE record_id = ?`,
        [assessment_type ?? null, score ?? null, weight ?? null, attendance_status ?? null, record_id]
        );
        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
        const [rows] = await pool.execute(`SELECT * FROM grades_and_attendance WHERE record_id = ?`, [record_id]);
        res.json(rows[0]);
    } catch (e) { next(e); }
});

// Update ONLY attendance_status to 'Pending'
// [PATCH /grades-and-attendance/:record_id/attendance-pending]
router.patch('/:record_id/attendance-pending', async (req, res, next) => {
    try {
        const { record_id } = req.params;

        // Force it to 'Pending', ignore whatever the client sends
        const [r] = await pool.execute(
        `UPDATE grades_and_attendance
        SET attendance_status = 'Pending'
        WHERE record_id = ?`,
        [record_id]
        );

        if (!r.affectedRows) {
        return res.status(404).json({ error: 'Not found' });
        }

        const [rows] = await pool.execute(
        `SELECT * FROM grades_and_attendance WHERE record_id = ?`,
        [record_id]
        );
        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});


// DELETE
router.delete('/:record_id', async (req, res, next) => {
    try {
        const { record_id } = req.params;
        const [r] = await pool.execute(`DELETE FROM grades_and_attendance WHERE record_id = ?`, [record_id]);
        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    } catch (e) { next(e); }
});

module.exports = router;
