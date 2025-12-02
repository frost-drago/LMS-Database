const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

// backticks are template literals

// CREATE
// [POST /courses] 
router.post('/', async (req, res, next) => {
    try {
        // Get data from the request body
        const { course_code, course_name, credit, course_description } = req.body;
        // pool is a MySQL connection pool created by mysql2. Execute the query.
        let query = `INSERT INTO course (course_code, course_name, credit, course_description)
                     VALUES
                     (?, ?, ?, ?)`;
        let parameters = [course_code, course_name, credit, course_description ?? null];
        await pool.execute(query, parameters);

        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data.
        let query2 = `SELECT * FROM course 
                      WHERE course_code = ?`;
        let parameters2 = [course_code];
        const [rows] = await pool.execute(query2, parameters2);
        // Return
        // rows is an array of results. rows[0] = the inserted course.
        // status(201) = HTTP code “Created”.
        res.status(201).json(rows[0]);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// READ (list + optional search)
// [GET /courses]
router.get('/', async (req, res, next) => {
    try {
        // /courses → no q
        // /courses?q=algo → q = 'algo'
        const { q } = req.query; // optional search by name/code
        // build query
        let query = `SELECT * FROM course`;
        let parameters = [];
        if (q) {
            query += ` WHERE (course_code LIKE ? OR course_name LIKE ?)`;
            parameters = [`%${q}%`, `%${q}%`];
        }
        query += ` ORDER BY course_code`;
        // Execute the query
        const [rows] = await pool.execute(query, parameters);
        // Optional search via req.query → adapt SQL → return array of rows.
        res.json(rows);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// READ ONE
// [GET /courses/:course_code]
router.get('/:course_code', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { course_code } = req.params;
        // Execute the query
        let query = `SELECT * FROM course
                     WHERE course_code = ?`;
        let parameters = [course_code];
        const [rows] = await pool.execute(query, parameters);
        // Check if exists
        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        // Return the course
        res.json(rows[0]);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// UPDATE
// [PUT /courses/:course_code]
router.put('/:course_code', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { course_code } = req.params;
        // Get data from the request body
        const { course_name, credit, course_description } = req.body;
        // Execute the query
        let query = `UPDATE course 
                     SET course_name = ?, credit = ?, course_description = ?
                     WHERE course_code = ?`;
        let parameters = [course_name, credit, course_description ?? null, course_code];
        const [result] = await pool.execute(query, parameters);
        // Check if anything changed. If not, error 404
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        // Execute the query. Return the updated row. This is to see whether info is correct or not.
        let query2 = `SELECT * FROM course 
                      WHERE course_code = ?`;
        let parameters2 = [course_code];
        const [rows] = await pool.execute(query2, parameters2);
        res.json(rows[0]);
    } catch (e) { 
        // Catch any error
        next(e);
    }
});

// DELETE
// [DELETE /courses/:course_code]
router.delete('/:course_code', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { course_code } = req.params;
        // Execute the query
        let query = `DELETE FROM course
                     WHERE course_code = ?`;
        let parameters = [course_code];
        const [result] = await pool.execute(query, parameters);
        // Check if anything deleted. If not, error 404. 
        // If affectedRows = 0 → nothing matched the WHERE condition → the course does NOT exist
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        // Return "success but no response body" (204)
        res.status(204).end();
    } catch (e) { 
    // Catch any error
        next(e);
    }
});

module.exports = router;
