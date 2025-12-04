const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body  → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

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

        // Insert into class_session
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

        // Fetch the inserted row with context (join class_offering, course, term)
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
        let parameters2 = [r.insertId];
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

module.exports = router;
