// routes/teaching_assignments.js
const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

// backticks are template literals

// CREATE
// [POST /teaching-assignments]
router.post('/', async (req, res, next) => {
    try {
        // Get data from the request body
        const { instructor_id, class_offering_id, teaching_role } = req.body;

        // If any of the two composite PKs are missing, reject.
        if (!instructor_id || !class_offering_id) {
            return res.status(400).json({
                error: 'instructor_id and class_offering_id are required',
            });
        }

        // Execute query
        let query = `INSERT INTO teaching_assignment (instructor_id, class_offering_id, teaching_role)
                     VALUES 
                     (?, ?, ?)`;
        let parameters = [instructor_id, class_offering_id, teaching_role ?? 'Lecturer'];
        await pool.execute(query, parameters);

        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data.
        let query2 = `SELECT * FROM teaching_assignment
                      WHERE instructor_id = ? AND class_offering_id = ?`;
        let parameters2 = [instructor_id, class_offering_id];
        const [rows] = await pool.execute(query2, parameters2);
        // Return
        // rows is an array of results. rows[0] = the inserted instructor.
        // status(201) = HTTP code “Created”.
        return res.status(201).json(rows[0]);
    } catch (e) {
        // Catch any error
        next(e);
    }
});

// READ (list, with optional filters)
// [GET /teaching-assignments]
// Optional query params: ?instructor_id=...&class_offering_id=...&teaching_role=...
router.get('/', async (req, res, next) => {
    try {
        const { instructor_id, class_offering_id, teaching_role } = req.query;

        // build query
        let query = `SELECT * 
                     FROM teaching_assignment
                     WHERE 1=1`;
        const parameters = [];

        if (instructor_id) {
            query += ` AND instructor_id = ?`;
            parameters.push(instructor_id);
        }

        if (class_offering_id) {
            query += ` AND class_offering_id = ?`;
            parameters.push(class_offering_id);
        }

        if (teaching_role) {
            query += ` AND teaching_role = ?`;
            parameters.push(teaching_role);
        }

        query += ` ORDER BY instructor_id, class_offering_id`;
        const [rows] = await pool.execute(query, parameters);
        
        // Optional search via req.query → adapt SQL → return array of rows.
        return res.json(rows);
    } catch (e) {
        // Catch any error
        next(e);
    }
});

// READ ONE
// [GET /teaching-assignments/:instructor_id/:class_offering_id]
router.get('/:instructor_id/:class_offering_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { instructor_id, class_offering_id } = req.params;
        // Execute the query
        let query = `SELECT * 
                     FROM teaching_assignment
                     WHERE instructor_id = ? AND class_offering_id = ?`;
        let parameters = [instructor_id, class_offering_id];
        const [rows] = await pool.execute(query, parameters);
        // Check if exists
        if (!rows.length) {
            return res.status(404).json({ error: 'Not found' });
        }
        // Return the teaching assignment
        return res.json(rows[0]);
    } catch (e) {
        // Catch any error
        next(e);
    }
});

// UPDATE
// We don't change the PK (composite), so only teaching_role is updatable.
// [PUT /teaching-assignments/:instructor_id/:class_offering_id]
router.put('/:instructor_id/:class_offering_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { instructor_id, class_offering_id } = req.params;
        // Get data from the request body
        const { teaching_role } = req.body;

        // Teaching role
        if (!teaching_role) {
            return res.status(400).json({
                error: 'teaching_role is required for update',
            });
        }

        // Execute the query
        let query = `UPDATE teaching_assignment
                     SET teaching_role = ?
                     WHERE instructor_id = ? AND class_offering_id = ?`;
        let parameters = [teaching_role, instructor_id, class_offering_id];
        const [result] = await pool.execute(query, parameters);

        // If the combination of instructor_id and class_offering_id does not exist.
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        // Return updated row. This is to see whether info is correct or not.
        let query2 = `SELECT * 
                      FROM teaching_assignment
                      WHERE instructor_id = ? AND class_offering_id = ?`;
        let parameters2 = [instructor_id, class_offering_id];
        const [rows] = await pool.execute(query2, parameters2);
        return res.json(rows[0]);
    } catch (e) {
        // Catch any error
        next(e);
    }
});

// DELETE
// [DELETE /teaching-assignments/:instructor_id/:class_offering_id]
router.delete('/:instructor_id/:class_offering_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { instructor_id, class_offering_id } = req.params;

        // Execute the query
        let query = `DELETE FROM teaching_assignment
                     WHERE instructor_id = ? AND class_offering_id = ?`;
        let parameters = [instructor_id, class_offering_id];
        const [result] = await pool.execute(query, parameters);

        // If there is a mistake
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Not found' });
        }

        // 204 = No Content (successful delete)
        return res.status(204).end();
    } catch (e) {
        // Catch any error
        next(e);
    }
});

module.exports = router;