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

        let sql = `
        SELECT
            ga.record_id,
            ga.enrolment_id,
            ga.session_id,
            ga.assessment_type,
            ga.score,
            ga.weight,
            ga.attendance_status,

            -- Student info
            e.student_id,
            p.full_name AS student_name,
            p.email AS student_email

        FROM grades_and_attendance ga
        JOIN enrolment e ON e.enrolment_id = ga.enrolment_id
        JOIN student s ON s.student_id = e.student_id
        JOIN person p ON p.person_id = s.person_id

        WHERE 1=1
        `;

        const params = [];

        if (enrolment_id) { sql += ` AND ga.enrolment_id = ?`; params.push(enrolment_id); }
        if (session_id)   { sql += ` AND ga.session_id = ?`; params.push(session_id); }

        sql += ` ORDER BY p.full_name, ga.record_id`;

        const [rows] = await pool.execute(sql, params);
        res.json(rows);

    } catch (e) {
        next(e);
    }
});

// READ: all grades & attendance for one class offering
// [GET /grades-attendance/by-class-offering/:class_offering_id]
router.get('/by-class-offering/:class_offering_id', async (req, res, next) => {
    try {
        const { class_offering_id } = req.params;

        /*
           Schema recap:
           - class_session(session_id, class_offering_id, session_no,
                          session_start_date, session_end_date, title, room)
           - enrolment(enrolment_id, class_offering_id, student_id, enrolment_status, ...)
           - student(person_id, student_id, cohort)
           - person(person_id, full_name, email, ...)
           - grades_and_attendance(record_id, enrolment_id, session_id,
                                   assessment_type, score, weight, attendance_status)
        */

        const sql = `
            SELECT
                ga.record_id,
                ga.enrolment_id,
                ga.session_id,
                ga.assessment_type,
                ga.score,
                ga.weight,
                ga.attendance_status,

                -- session info
                cs.class_offering_id,
                cs.session_no,
                cs.session_start_date,
                cs.session_end_date,
                cs.title       AS session_title,
                cs.room,

                -- enrolment / student info
                e.student_id,
                e.enrolment_status,
                p.full_name    AS student_name,
                p.email        AS student_email
            FROM grades_and_attendance ga
            JOIN class_session cs
                ON cs.session_id = ga.session_id
            JOIN enrolment e
                ON e.enrolment_id = ga.enrolment_id
            JOIN student s
                ON s.student_id = e.student_id
            JOIN person p
                ON p.person_id = s.person_id
            WHERE cs.class_offering_id = ?
            ORDER BY
                cs.session_no,
                p.full_name,
                ga.record_id
        `;

        const [rows] = await pool.execute(sql, [class_offering_id]);
        res.json(rows);
    } catch (e) {
        next(e);
    }
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

// [PATCH /grades-attendance/verify-all/:session_id]
// Convert all "Pending" attendance in this session → "Verified"
router.patch('/verify-all/:session_id', async (req, res, next) => {
    try {
        const { session_id } = req.params;

        const [r] = await pool.execute(
            `UPDATE grades_and_attendance
             SET attendance_status = 'Verified'
             WHERE session_id = ?
               AND attendance_status = 'Pending'`,
            [session_id]
        );

        res.json({
            message: 'Updated successfully',
            updated: r.affectedRows
        });
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
