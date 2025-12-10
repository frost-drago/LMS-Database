const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body  → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

// CREATE
// [POST /class-sessions]
// CREATE
// [POST /class-sessions]
router.post('/', async (req, res, next) => {
    try {
        // Get data from the request body
        const {
            class_offering_id,
            session_no,
            session_start_date,
            session_end_date,
            title,
            room
        } = req.body;

        // 1) Insert into class_session
        let query = `
            INSERT INTO class_session 
                (class_offering_id, session_no, session_start_date, session_end_date, title, room)
            VALUES
                (?, ?, ?, ?, ?, ?)
        `;
        let parameters = [
            class_offering_id,
            session_no,
            session_start_date,
            session_end_date,
            title ?? null,
            room ?? null
        ];

        const [r] = await pool.execute(query, parameters);
        const newSessionId = r.insertId;

        // 2) Get all active enrolments for this class_offering
        const [enrolments] = await pool.execute(
            `
            SELECT enrolment_id
            FROM enrolment
            WHERE class_offering_id = ?
              AND enrolment_status = 'Active'
            `,
            [class_offering_id]
        );

        // 3) Create grades_and_attendance rows for each enrolled student
        //    Default: assessment_type = 'Session', score = 0, weight = 0, attendance = 'Not attended'
        if (enrolments.length > 0) {
            const valuePlaceholders = [];
            const gaParams = [];

            enrolments.forEach(row => {
                valuePlaceholders.push('(?, ?, ?, ?, ?, ?)');
                gaParams.push(
                    row.enrolment_id,     // enrolment_id
                    newSessionId,         // session_id
                    'Session',            // assessment_type (you can rename this if you want)
                    0,                    // score (must be 0–100, NOT NULL)
                    0,                    // weight (must be 0–100, NOT NULL)
                    'Not attended'        // attendance_status
                );
            });

            const gaSql = `
                INSERT INTO grades_and_attendance
                    (enrolment_id, session_id, assessment_type, score, weight, attendance_status)
                VALUES ${valuePlaceholders.join(', ')}
            `;

            await pool.execute(gaSql, gaParams);
        }

        // 4) Fetch the inserted row with context (join class_offering, course, term)
        let query2 = `
            SELECT 
                cs.*,
                co.course_code,
                co.class_group,
                co.class_type,
                c.course_name,
                t.term_label
            FROM class_session cs
            JOIN class_offering co ON co.class_offering_id = cs.class_offering_id
            JOIN course c ON c.course_code = co.course_code
            JOIN term t ON t.term_id = co.term_id
            WHERE cs.session_id = ?
        `;
        let parameters2 = [newSessionId];
        const [rows] = await pool.execute(query2, parameters2);

        // status(201) = HTTP code "Created"
        res.status(201).json(rows[0]);
    } catch (e) {
        // Let Express error handler deal with it (FK/unique/check constraint errors, etc.)
        next(e);
    }
});


// READ (with joins and optional filters/search)
// [GET /class-sessions]
router.get('/', async (req, res, next) => {
    try {
        const { q, class_offering_id } = req.query;

        let query = `
            SELECT
                cs.*,
                co.course_code,
                co.class_group,
                co.class_type,
                c.course_name,
                t.term_label
            FROM class_session cs
            JOIN class_offering co ON co.class_offering_id = cs.class_offering_id
            JOIN course c ON c.course_code = co.course_code
            JOIN term t ON t.term_id = co.term_id
        `;
        const parameters = [];
        const conditions = [];

        // Optional filter by class_offering_id (for "sessions in this class")
        if (class_offering_id) {
            conditions.push('cs.class_offering_id = ?');
            parameters.push(class_offering_id);
        }

        // Optional search by title/room/course
        if (q) {
            conditions.push(`
                (cs.title LIKE ? 
                 OR cs.room LIKE ?
                 OR co.course_code LIKE ?
                 OR c.course_name LIKE ?)
            `);
            parameters.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
        }

        if (conditions.length) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Order by start date, then session_no (reasonable default)
        query += ' ORDER BY cs.session_start_date, cs.session_no';

        const [rows] = await pool.execute(query, parameters);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

// UPDATE
// [PUT /class-sessions/:id]
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            class_offering_id,
            session_no,
            session_start_date,
            session_end_date,
            title,
            room
        } = req.body;

        // Update row
        let query = `
            UPDATE class_session
            SET 
                class_offering_id = ?,
                session_no = ?,
                session_start_date = ?,
                session_end_date = ?,
                title = ?,
                room = ?
            WHERE session_id = ?
        `;
        let parameters = [
            class_offering_id,
            session_no,
            session_start_date,
            session_end_date,
            title ?? null,
            room ?? null,
            id
        ];

        const [result] = await pool.execute(query, parameters);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        // Return updated row (with joins)
        let query2 = `
            SELECT
                cs.*,
                co.course_code,
                co.class_group,
                co.class_type,
                c.course_name,
                t.term_label
            FROM class_session cs
            JOIN class_offering co ON co.class_offering_id = cs.class_offering_id
            JOIN course c ON c.course_code = co.course_code
            JOIN term t ON t.term_id = co.term_id
            WHERE cs.session_id = ?
        `;
        let parameters2 = [id];
        const [rows] = await pool.execute(query2, parameters2);

        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// DELETE
// [DELETE /class-sessions/:id]
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        let query = `
            DELETE FROM class_session
            WHERE session_id = ?
        `;
        let parameters = [id];

        const [result] = await pool.execute(query, parameters);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        // 204 = "No Content"
        res.status(204).end();
    } catch (e) {
        next(e);
    }
});

// READ sessions with this student's grades + attendance
// [GET /class-sessions/by-student/:student_id/:class_offering_id]
router.get('/by-student/:student_id/:class_offering_id', async (req, res, next) => {
    try {
        const { student_id, class_offering_id } = req.params;

        const sql = `
            SELECT
                cs.session_id,
                cs.session_no,
                cs.session_start_date,
                cs.session_end_date,
                cs.title,
                cs.room,
                -- enrolment info
                e.enrolment_id,
                -- grades + attendance (may be NULL if not yet recorded)
                ga.record_id,
                ga.assessment_type,
                ga.score,
                ga.weight,
                ga.attendance_status
            FROM class_session cs
            -- make sure sessions belong to this class
            JOIN class_offering co
                ON co.class_offering_id = cs.class_offering_id
            -- this student's enrolment in that class
            JOIN enrolment e
                ON e.class_offering_id = cs.class_offering_id
            AND e.student_id = ?
            -- the grade/attendance for that (enrolment, session) pair
            LEFT JOIN grades_and_attendance ga
                ON ga.session_id = cs.session_id
            AND ga.enrolment_id = e.enrolment_id
            WHERE cs.class_offering_id = ?
            ORDER BY cs.session_start_date, cs.session_no
        `;

        const params = [student_id, class_offering_id];
        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});


module.exports = router;
