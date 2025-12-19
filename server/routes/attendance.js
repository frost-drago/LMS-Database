// routes/attendance.js
const router = require('express').Router();
const { pool } = require('../db');

/*
TABLE: attendance(attendance_id PK, enrolment_id, session_id, attendance_status ENUM, UNIQUE(enrolment_id, session_id))

Base path suggestion: /attendance
*/

// --- INSTRUCTOR-SCOPED ATTENDANCE (roster + safe updates) ---

async function assertInstructorTeachesSession(instructor_id, session_id) {
    const [rows] = await pool.execute(
        `
        SELECT 1
        FROM class_session cs
        JOIN teaching_assignment ta
        ON ta.class_offering_id = cs.class_offering_id
        WHERE cs.session_id = ?
        AND ta.instructor_id = ?
        LIMIT 1
        `,
        [session_id, instructor_id]
    );
    return rows.length > 0;
}


// GET roster for a session taught by this instructor
// GET /attendance/instructor/:instructor_id/session/:session_id?enrolment_id=...
// GET /api/attendance/instructor/:instructor_id/session/:session_id
router.get('/instructor/:instructor_id/session/:session_id', async (req, res) => {
    const { instructor_id, session_id } = req.params;

    try {
        // Authorize instructor for this session
        const [authRows] = await pool.execute(
        `
        SELECT cs.class_offering_id
        FROM class_session cs
        JOIN teaching_assignment ta
            ON ta.class_offering_id = cs.class_offering_id
        AND ta.instructor_id = ?
        WHERE cs.session_id = ?
        LIMIT 1
        `,
        [instructor_id, session_id]
        );

        if (authRows.length === 0) {
        return res.status(404).json({ message: 'Session not found for this instructor' });
        }

        // Fetch roster + attendance
        const [rows] = await pool.execute(
        `
        SELECT
            e.enrolment_id,
            s.student_id,
            p.full_name AS student_name,
            COALESCE(a.attendance_status, 'Not attended') AS attendance_status,
            a.attendance_id
        FROM class_session cs
        JOIN enrolment e
            ON e.class_offering_id = cs.class_offering_id
        JOIN student s
            ON s.student_id = e.student_id
        JOIN person p
            ON p.person_id = s.person_id
        LEFT JOIN attendance a
            ON a.enrolment_id = e.enrolment_id
        AND a.session_id = cs.session_id
        WHERE cs.session_id = ?
        ORDER BY p.full_name ASC
        `,
        [session_id]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// Upsert attendance for one enrolment (guarded by instructor/session)
// POST /attendance/instructor/:instructor_id/session/:session_id
// body: { enrolment_id, attendance_status }
router.post('/instructor/:instructor_id/session/:session_id', async (req, res, next) => {
    try {
        const { instructor_id, session_id } = req.params;
        const { enrolment_id, attendance_status } = req.body;

        const ok = await assertInstructorTeachesSession(instructor_id, session_id);
        if (!ok) return res.status(403).json({ error: 'Forbidden' });

        // ensure enrolment belongs to same class offering as session
        const [chk] = await pool.execute(
        `
        SELECT 1
        FROM class_session cs
        JOIN enrolment e ON e.class_offering_id = cs.class_offering_id
        WHERE cs.session_id = ?
            AND e.enrolment_id = ?
        LIMIT 1
        `,
        [session_id, enrolment_id]
        );
        if (!chk.length) return res.status(400).json({ error: 'Invalid enrolment_id for this session' });

        await pool.execute(
        `
        INSERT INTO attendance (enrolment_id, session_id, attendance_status)
        VALUES (?, ?, COALESCE(?, 'Not attended'))
        ON DUPLICATE KEY UPDATE
            attendance_status = VALUES(attendance_status)
        `,
        [enrolment_id, session_id, attendance_status ?? null]
        );

        // Return the updated row
        const [rows] = await pool.execute(
        `
        SELECT attendance_id, enrolment_id, session_id, attendance_status
        FROM attendance
        WHERE enrolment_id = ? AND session_id = ?
        `,
        [enrolment_id, session_id]
        );

        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// POST /api/attendance/instructor/:instructor_id/session/:session_id/verify-pending
router.post('/instructor/:instructor_id/session/:session_id/verify-pending', async (req, res) => {
    const { instructor_id, session_id } = req.params;

    try {
        // Authorize instructor for this session
        const [auth] = await pool.execute(
        `
        SELECT 1
        FROM class_session cs
        JOIN teaching_assignment ta
            ON ta.class_offering_id = cs.class_offering_id
        AND ta.instructor_id = ?
        WHERE cs.session_id = ?
        LIMIT 1
        `,
        [instructor_id, session_id]
        );

        if (!auth.length) {
        return res.status(403).json({ message: 'Not authorized for this session' });
        }

        // Verify all pending attendance
        const [result] = await pool.execute(
        `
        UPDATE attendance a
        JOIN enrolment e
            ON e.enrolment_id = a.enrolment_id
        JOIN class_session cs
            ON cs.class_offering_id = e.class_offering_id
        SET a.attendance_status = 'Verified'
        WHERE cs.session_id = ?
            AND a.attendance_status = 'Pending'
        `,
        [session_id]
        );

        res.json({
        updated: result.affectedRows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// PATCH /api/attendance/student/:student_id/session/:session_id/pending
router.patch('/student/:student_id/session/:session_id/pending', async (req, res) => {
    const { student_id, session_id } = req.params;

    try {
        // Find enrolment for this student in this session's class offering
        const [rows] = await pool.execute(
        `
        SELECT e.enrolment_id
        FROM class_session cs
        JOIN enrolment e
            ON e.class_offering_id = cs.class_offering_id
        WHERE cs.session_id = ?
            AND e.student_id = ?
        LIMIT 1
        `,
        [session_id, student_id]
        );

        if (!rows.length) {
        return res.status(404).json({ message: 'No enrolment found for this student & session' });
        }

        const enrolment_id = rows[0].enrolment_id;

        // Upsert: only allow Not attended -> Pending (including "no row yet")
        // If already Pending or Verified, keep as-is (and tell client)
        await pool.execute(
        `
        INSERT INTO attendance (enrolment_id, session_id, attendance_status)
        VALUES (?, ?, 'Pending')
        ON DUPLICATE KEY UPDATE
            attendance_status = CASE
            WHEN attendance_status = 'Not attended' THEN 'Pending'
            ELSE attendance_status
            END
        `,
        [enrolment_id, session_id]
        );

        const [out] = await pool.execute(
        `
        SELECT attendance_id, attendance_status
        FROM attendance
        WHERE enrolment_id = ? AND session_id = ?
        LIMIT 1
        `,
        [enrolment_id, session_id]
        );

        // If it was already Verified, it will stay Verified; frontend can just display it
        res.json(out[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// CREATE (upsert-friendly)
// POST /attendance
router.post('/', async (req, res, next) => {
    try {
        const { enrolment_id, session_id, attendance_status } = req.body;

        const [r] = await pool.execute(
            `
            INSERT INTO attendance (enrolment_id, session_id, attendance_status)
            VALUES (?, ?, COALESCE(?, 'Not attended'))
            ON DUPLICATE KEY UPDATE
                attendance_status = VALUES(attendance_status)
            `,
            [enrolment_id, session_id, attendance_status ?? null]
        );

        // If inserted: insertId is the new PK. If updated: we need to fetch by unique key.
        const [rows] = await pool.execute(
            `SELECT * FROM attendance WHERE enrolment_id = ? AND session_id = ?`,
            [enrolment_id, session_id]
        );

        // 201 when inserted, 200 when updated (mysql2 doesn't always expose "was inserted" cleanly; this is good enough)
        res.status(r.insertId ? 201 : 200).json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// READ (by enrolment or session)
// GET /attendance?enrolment_id=...&session_id=...
router.get('/', async (req, res, next) => {
    try {
        const { enrolment_id, session_id } = req.query;

        let sql = `
            SELECT
                a.attendance_id,
                a.enrolment_id,
                a.session_id,
                a.attendance_status,

                -- session info (optional but useful)
                cs.class_offering_id,
                cs.session_no,
                cs.session_start_date,
                cs.session_end_date,
                cs.title AS session_title,
                cs.room,

                -- student info
                e.student_id,
                e.enrolment_status,
                p.full_name AS student_name,
                p.email AS student_email
            FROM attendance a
            JOIN enrolment e ON e.enrolment_id = a.enrolment_id
            JOIN student s ON s.student_id = e.student_id
            JOIN person p ON p.person_id = s.person_id
            JOIN class_session cs ON cs.session_id = a.session_id
            WHERE 1=1
        `;

        const params = [];
        if (enrolment_id) {
            sql += ` AND a.enrolment_id = ?`;
            params.push(enrolment_id);
        }
        if (session_id) {
            sql += ` AND a.session_id = ?`;
            params.push(session_id);
        }

        sql += ` ORDER BY cs.session_no, p.full_name, a.attendance_id`;

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

// READ: all attendance for one class offering
// GET /attendance/by-class-offering/:class_offering_id
router.get('/by-class-offering/:class_offering_id', async (req, res, next) => {
    try {
        const { class_offering_id } = req.params;

        const sql = `
            SELECT
                a.attendance_id,
                a.enrolment_id,
                a.session_id,
                a.attendance_status,

                cs.class_offering_id,
                cs.session_no,
                cs.session_start_date,
                cs.session_end_date,
                cs.title AS session_title,
                cs.room,

                e.student_id,
                e.enrolment_status,
                p.full_name AS student_name,
                p.email AS student_email
            FROM attendance a
            JOIN class_session cs ON cs.session_id = a.session_id
            JOIN enrolment e ON e.enrolment_id = a.enrolment_id
            JOIN student s ON s.student_id = e.student_id
            JOIN person p ON p.person_id = s.person_id
            WHERE cs.class_offering_id = ?
            ORDER BY cs.session_no, p.full_name, a.attendance_id
        `;

        const [rows] = await pool.execute(sql, [class_offering_id]);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

// UPDATE (general)
// PUT /attendance/:attendance_id
router.put('/:attendance_id', async (req, res, next) => {
    try {
        const { attendance_id } = req.params;
        const { attendance_status } = req.body;

        const [r] = await pool.execute(
            `
            UPDATE attendance
            SET attendance_status = COALESCE(?, attendance_status)
            WHERE attendance_id = ?
            `,
            [attendance_status ?? null, attendance_id]
        );

        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

        const [rows] = await pool.execute(
            `SELECT * FROM attendance WHERE attendance_id = ?`,
            [attendance_id]
        );
        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// PATCH: set one record to Pending
// PATCH /attendance/:attendance_id/pending
router.patch('/:attendance_id/pending', async (req, res, next) => {
    try {
        const { attendance_id } = req.params;

        const [r] = await pool.execute(
            `
            UPDATE attendance
            SET attendance_status = 'Pending'
            WHERE attendance_id = ?
            `,
            [attendance_id]
        );

        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

        const [rows] = await pool.execute(
            `SELECT * FROM attendance WHERE attendance_id = ?`,
            [attendance_id]
        );
        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// PATCH: verify all pending for a session
// PATCH /attendance/verify-all/:session_id
router.patch('/verify-all/:session_id', async (req, res, next) => {
    try {
        const { session_id } = req.params;

        const [r] = await pool.execute(
            `
            UPDATE attendance
            SET attendance_status = 'Verified'
            WHERE session_id = ?
                AND attendance_status = 'Pending'
            `,
            [session_id]
        );

        res.json({ message: 'Updated successfully', updated: r.affectedRows });
    } catch (e) {
        next(e);
    }
});

// DELETE
// DELETE /attendance/:attendance_id
router.delete('/:attendance_id', async (req, res, next) => {
    try {
        const { attendance_id } = req.params;

        const [r] = await pool.execute(
            `DELETE FROM attendance WHERE attendance_id = ?`,
            [attendance_id]
        );

        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    } catch (e) {
        next(e);
    }
});

module.exports = router;
