const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

// backticks are template literals

// CREATE
// [POST /terms] 
router.post('/', async (req, res, next) => {
    try {
        // Get data from the request body
        const { start_date, end_date, term_label } = req.body;
        // pool is a MySQL connection pool created by mysql2. Execute the query.
        let query = `INSERT INTO term (start_date, end_date, term_label) 
                     VALUES 
                     (?, ?, ?)`;
        let parameters = [start_date, end_date, term_label];
        const [r] = await pool.execute(query, parameters);

        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data. 
        let query2 = `SELECT * FROM term 
                      WHERE term_id = ?`;
        let parameters2 = [r.insertId];
        const [rows] = await pool.execute(query2, parameters2);
        // Return
        // rows is an array of results. rows[0] = the inserted term.
        // status(201) = HTTP code “Created”.
        res.status(201).json(rows[0]);
    } catch (e) { 
        // Catch any error
        next(e);
    }
});

// READ (list)
// [GET /terms]
router.get('/', async (_req, res, next) => {
    try {
        // Execute query
        let query = `SELECT * 
                     FROM term 
                     ORDER BY term_id DESC`;
        const [rows] = await pool.execute(query);
        res.json(rows);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// UPDATE
// [PUT /terms/:term_id]
router.put('/:term_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { term_id } = req.params;
        // Get data from the request body
        const { start_date, end_date, term_label } = req.body;
        // Execute the query
        let query = `UPDATE term 
                     SET start_date = ?, end_date = ?, term_label = ? 
                     WHERE term_id = ?`;
        let parameters = [start_date, end_date, term_label, term_id];
        const [result] = await pool.execute(query, parameters);
        // Check if anything changed. If not, error 404
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }
        // Execute the query. Return the updated row. This is to see whether info is correct or not.
        let query2 = `SELECT * FROM term 
                      WHERE term_id = ?`;
        let parameters2 = [term_id];
        const [rows] = await pool.execute(query2, parameters2);
        res.json(rows[0]);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// DELETE
// [DELETE /terms/:term_id]
router.delete('/:term_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { term_id } = req.params;
        // Execute the query
        let query = `DELETE FROM term
                     WHERE term_id = ?`;
        let parameters = [term_id];
        const [result] = await pool.execute(query, parameters);
        // Check if anything deleted. If not, error 404. 
        // If affectedRows = 0 → nothing matched the WHERE condition → the term does NOT exist
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
