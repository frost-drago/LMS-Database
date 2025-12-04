const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

// backticks are template literals

// CREATE (from existing course)
// [POST /class-offerings]
router.post('/', async (req, res, next) => {
    try {
        // Get data from the request body
        const { course_code, term_id, class_group, class_type } = req.body;
        // Execute query
        let query = `INSERT INTO class_offering (course_code, term_id, class_group, class_type)
                     VALUES 
                     (?, ?, ?, ?)`;
        let parameters = [course_code, term_id, class_group, class_type];
        const [r] = await pool.execute(query, parameters);
        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data.
        let query2 = `SELECT co.*, c.course_name, t.term_label
                      FROM class_offering co
                      JOIN course c ON c.course_code = co.course_code
                      JOIN term t ON t.term_id = co.term_id
                      WHERE co.class_offering_id = ?`;
        let parameters2 = [r.insertId];
        const [rows] = await pool.execute(query2, parameters2);
        // Return
        // rows is an array of results. rows[0] = the inserted instructor.
        // status(201) = HTTP code “Created”.
        res.status(201).json(rows[0]);
    } catch (e) { 
        // Catch any error
        // If anything goes wrong, undo everything.
        next(e); 
    }
});

// READ (with joins and filters)
// [GET /class-offerings]
router.get('/', async (req, res, next) => {
    try {
        const { q } = req.query;
        // build query
        let query = `SELECT co.*, c.course_name, t.term_label
                     FROM class_offering co
                     JOIN course c ON c.course_code = co.course_code
                     JOIN term t ON t.term_id = co.term_id`;
        const parameters = [];
        if (q) { 
            query += ` WHERE (co.course_code LIKE ? OR c.course_name LIKE ?)`;
            parameters.push(`%${q}%`, `%${q}%`);
        }
        query += ` ORDER BY co.class_offering_id DESC`;
        const [rows] = await pool.execute(query, parameters);
        // Optional search via req.query → adapt SQL → return array of rows.
        res.json(rows);
    } catch (e) {
        // Catch any error
        next(e);
    }
});

// READ class offerings for a particular student
// [GET /class-offerings/by-student/:student_id]
router.get('/by-student/:student_id', async (req, res, next) => {
    try {
        const { student_id } = req.params;

        let query = `
            SELECT 
                co.class_offering_id,
                co.course_code,
                co.term_id,
                co.class_group,
                co.class_type,
                c.course_name,
                t.term_label,
                e.enrolment_status,
                e.enroled_at
            FROM enrolment e
            JOIN class_offering co ON co.class_offering_id = e.class_offering_id
            JOIN course c ON c.course_code = co.course_code
            JOIN term t ON t.term_id = co.term_id
            WHERE e.student_id = ?
            ORDER BY t.start_date DESC, co.course_code, co.class_group
        `;
        const parameters = [student_id];

        const [rows] = await pool.execute(query, parameters);
        res.json(rows);  // array of class offerings for that student
    } catch (e) {
        next(e);
    }
});


// UPDATE
// [PUT /class-offerings/:id]
router.put('/:id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { id } = req.params;
        // Get data from the request body
        const { course_code, term_id, class_group, class_type } = req.body;
        // Execute the query
        let query = `UPDATE class_offering 
                     SET course_code = ?, term_id = ?, class_group = ?, class_type = ?
                     WHERE class_offering_id = ?`;
        let parameters = [course_code, term_id, class_group, class_type, id]
        const [result] = await pool.execute(query, parameters);
        // Check if anything changed. If not, error 404
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        // Execute the query. Return the updated row. This is to see whether info is correct or not.
        let query2 = `SELECT co.*, c.course_name, t.term_label
                      FROM class_offering co
                      JOIN course c ON c.course_code = co.course_code
                      JOIN term t ON t.term_id = co.term_id
                      WHERE co.class_offering_id = ?`;
        let parameters2 = [id];
        const [rows] = await pool.execute(query2, parameters2);
        res.json(rows[0]);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// DELETE
// [DELETE /class-offerings/:id]
router.delete('/:id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { id } = req.params;
        // Execute the query
        let query = `DELETE FROM class_offering 
                     WHERE class_offering_id = ?`;
        let parameters = [id];
        const [result] = await pool.execute(query, parameters);
        // Check if anything deleted. If not, error 404. 
        // If affectedRows = 0 → nothing matched the WHERE condition → the course does NOT exist
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        // Return "success but no response body" (204)
        res.status(204).end();
    } catch (e) {
        next(e);
    }
});

module.exports = router;
