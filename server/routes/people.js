const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

// backticks are template literals

// CREATE person
// [POST /people]
router.post('/', async (req, res, next) => {
    try {
        // Get data from the request body
        const { full_name, email } = req.body;
        // pool is a MySQL connection pool created by mysql2. Execute the query.
        let query = `INSERT INTO person (full_name, email) 
                     VALUES 
                     (?, ?)`;
        let parameters = [full_name, email];
        const [result] = await pool.execute(query, parameters);

        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data.
        let query2 = `SELECT * FROM person 
                      WHERE person_id = ?`;
        let parameters2 = [result.insertId]; // Because surrogate key
        const [rows] = await pool.execute(query2, parameters2);
        // Return
        // rows is an array of results. rows[0] = the inserted person.
        // status(201) = HTTP code “Created”.
        res.status(201).json(rows[0]);
    } catch (e) {
        // Catch any error
        next(e);
    }
});

// READ everyone
// [GET /people]
router.get('/', async (_req, res, next) => {
    try {
        // Execute query, no parameters
        query = `SELECT * FROM person 
                 ORDER BY person_id DESC`;
        const [rows] = await pool.execute(query);
        res.json(rows);
    } catch (e) {
        // Catch any error
        next(e);
    }
});

// READ ONE
// [GET /people/:person_id]
router.get('/:person_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { person_id } = req.params;
        // Execute the query
        query = `SELECT * FROM person 
                 WHERE person_id = ?`;
        parameters = [person_id];
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
// [PUT /people/:people_id]
router.put('/:person_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { person_id } = req.params;
        // Get data from the request body
        const { full_name, email } = req.body;
        // Execute the query
        query = `UPDATE person 
                 SET full_name = ?, email = ? 
                 WHERE person_id = ?`;
        parameters = [full_name, email, person_id];
        const [result] = await pool.execute(query, parameters);
        // Check if anything changed. If not, error 404
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        // Execute the query. Return the updated row. This is to see whether info is correct or not.
        query2 = `SELECT * FROM person
                  WHERE person_id = ?`;
        parameters2 = [person_id];
        const [rows] = await pool.execute(query2, parameters2);
        res.json(rows[0]);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// DELETE (will fail if referenced due to FK RESTRICT)
router.delete('/:person_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { person_id } = req.params;
        // Execute the query
        query = `DELETE FROM person 
                 WHERE person_id = ?`;
        parameters = [person_id];
        const [result] = await pool.execute(query, parameters);
        // Check if anything deleted. If not, error 404. 
        // If affectedRows = 0 → nothing matched the WHERE condition → the person does NOT exist
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
