// routes/instructors.js
const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

// backticks are template literals

// CREATE instructor (from existing person)
// [POST /instructors/from-person]
router.post('/from-person', async (req, res, next) => {
    // Manually claim a connection because a transaction is needed
    const conn = await pool.getConnection();
    try {
        // Get data from the request body
        const { person_id, instructor_id } = req.body;

        // Begin a transaction
        await conn.beginTransaction();

        // Execute query. Check that the person exists
        let query = `SELECT full_name, email 
                     FROM person 
                     WHERE person_id = ?`;
        let parameters = [person_id];
        const [pRows] = await conn.execute(query, parameters);
        if (!pRows.length) {
            await conn.rollback();
            return res.status(400).json({ error: 'Person not found' });
        }
        // Execute query. Insert instructor row
        let query2 = `INSERT INTO instructor (person_id, instructor_id) 
                      VALUES
                      (?, ?)`;
        let parameters2 = [person_id, instructor_id];
        await conn.execute(query2, parameters2);

        // If both executes are good, commit query.
        await conn.commit();

        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data.
        let query3 = `SELECT i.person_id, i.instructor_id, p.full_name, p.email
                      FROM instructor i JOIN person p ON p.person_id = i.person_id
                      WHERE i.instructor_id = ?`;
        let parameters3 = [instructor_id];
        const [rows] = await pool.execute(query3, parameters3);
        // Return
        // rows is an array of results. rows[0] = the inserted student.
        // status(201) = HTTP code “Created”.
        res.status(201).json(rows[0]);
    } catch (e) {
        // Catch any error
        // If anything goes wrong, undo everything.
        await conn.rollback();
        next(e);
    } finally {
        // Release connection either way
        conn.release();
    }
});

// CREATE instructor (also create person)
// [POST /instructors] 
router.post('/', async (req, res, next) => {
    // Manually claim a connection because a transaction is needed
    const conn = await pool.getConnection();
    try {
        // Get data from the request body
        const { full_name, email, instructor_id } = req.body;
        if (!full_name || !email || !instructor_id) {
        return res.status(400).json({ error: 'full_name, email, instructor_id are required' });
        }

        // Begin a transaction
        await conn.beginTransaction();

        // Execute query. Make person first.
        let query = `INSERT INTO person (full_name, email) 
                     VALUES 
                     (?, ?)`;
        let parameters = [full_name, email];
        const [p] = await conn.execute(query, parameters);
        const person_id = p.insertId;
        // Execute query. Make instructor after making a person.
        let query2 = `INSERT INTO instructor (person_id, instructor_id)
                      VALUES 
                      (?, ?)`;
        let parameters2 = [person_id, instructor_id];
        await conn.execute(query2, parameters2);

        // If both executes are good, commit query.
        await conn.commit();

        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data.
        let query3 = `SELECT i.person_id, i.instructor_id, p.full_name, p.email FROM instructor i
                      JOIN person p ON p.person_id = i.person_id
                      WHERE i.instructor_id = ?`;
        let parameters3 = [instructor_id];
        const [rows] = await pool.execute(query3, parameters3);
        // Return
        // rows is an array of results. rows[0] = the inserted instructor.
        // status(201) = HTTP code “Created”.
        res.status(201).json(rows[0]);
    } catch (e) {
        // Catch any error
        // If anything goes wrong, undo everything.
        await conn.rollback();
        next(e);
    } finally {
        // Release connection either way
        conn.release();
    }
});

// READ instructors (join person, list + optional search)
// [GET /instructors]
router.get('/', async (req, res, next) => {
    try {
        // /instructors → no q
        // /instructors?q=alex → q = 'alex'
        const { q } = req.query;
        // build query
        let query = `SELECT i.person_id, i.instructor_id, p.full_name, p.email FROM instructor i
                     JOIN person p ON p.person_id = i.person_id`;
        const parameters = [];
        if (q) {
            query += ` WHERE (p.full_name LIKE ? OR p.email LIKE ? OR i.instructor_id LIKE ?)`;
            parameters.push(`%${q}%`, `%${q}%`, `%${q}%`);
        }
        query += ` ORDER BY i.instructor_id`;
        const [rows] = await pool.execute(query, parameters);
        // Optional search via req.query → adapt SQL → return array of rows.
        res.json(rows);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// READ ONE
// [GET /instructors/:instructor_id]
router.get('/:instructor_id', async (req, res, next) => {
    try {
        // Get data from the request parameter
        const { instructor_id } = req.params;
        // Execute the query
        let query = `SELECT i.person_id, i.instructor_id, p.full_name, p.email
                     FROM instructor i JOIN person p ON p.person_id = i.person_id
                     WHERE i.instructor_id = ?`;
        let parameters = [instructor_id];
        const [rows] = await pool.execute(query, parameters);
        // Check if exists
        if (!rows.length) {
            return res.status(404).json({ error: 'Not found' });
        } 
        // Return the instructor
        res.json(rows[0]);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// UPDATE (can update both person + instructor)
// [PUT /instructors/:instructor_id]
router.put('/:instructor_id', async (req, res, next) => {
    // Manually claim a connection because a transaction is needed
    const conn = await pool.getConnection();
    try {
        // Get data from the request parameter
        const { instructor_id } = req.params;
        // Get data from the request body
        const { full_name, email, new_instructor_id } = req.body;

        // Begin a transaction
        await conn.beginTransaction();
        // Execute the query, find person_id first
        let query = `SELECT person_id 
                     FROM instructor 
                     WHERE instructor_id = ?`;
        let parameter = [instructor_id];
        const [iRows] = await conn.execute(query, parameter);
        // If instructor does NOT exist (prevents updating ghost instructor)
        if (!iRows.length) {
            await conn.rollback();
            return res.status(404).json({ error: 'Not found' });
        }

        // Save person_id for use later
        const person_id = iRows[0].person_id;

        // Update person if provided
        if (full_name != null || email != null) {
            // Execute query. Use COALESCE to put in input if not null
            let query2 = `UPDATE person
                          SET full_name = COALESCE(?, full_name), email = COALESCE(?, email)
                          WHERE person_id = ?`;
            let parameters2 = [full_name ?? null, email ?? null, person_id];
            await conn.execute(query2, parameters2);
        }
        // Update instructor if provided
        if (new_instructor_id != null && new_instructor_id !== instructor_id) {
            // Execute query
            let query3 = `UPDATE instructor 
                          SET instructor_id = ? 
                          WHERE person_id = ?`;
            let parameters3 = [new_instructor_id, person_id];
            await conn.execute(query3, parameters3);
        }
        // If all executes are good, commit query. 
        await conn.commit();

        // Execute the query. Return the updated row. This is to see whether info is correct or not.
        const idForSelect = new_instructor_id ?? instructor_id;
        let query4 = `SELECT i.person_id, i.instructor_id, p.full_name, p.email
                      FROM instructor i JOIN person p ON p.person_id = i.person_id
                      WHERE i.instructor_id = ?`;
        let parameters4 = [idForSelect];
        const [rows] = await pool.execute(query4, parameters4);
        res.json(rows[0]);
    } catch (e) {
        // Catch any error
        // If anything goes wrong, undo everything.
        await conn.rollback();
        next(e);
    } finally {
        // Release connection either way
        conn.release();
    }
});

// DELETE (will be blocked by FK if referenced elsewhere)
// [DELETE /instructors/:instructor_id]
router.delete('/:instructor_id', async (req, res, next) => {
    // Manually claim a connection because a transaction is needed
    const conn = await pool.getConnection();
    try {
        // Get data from the request parameter
        const { instructor_id } = req.params;
        // Begin a transaction
        await conn.beginTransaction();
        let query = `SELECT person_id 
                     FROM instructor
                     WHERE instructor_id = ?`;
        let parameters = [instructor_id];
        // Get person_id. Additionally see if the instructor exist or not.
        const [iRows] = await conn.execute(query, parameters);
        if (!iRows.length) {
            await conn.rollback();
            return res.status(404).json({ error: 'Not found' });
        }
        const person_id = iRows[0].person_id;
        // Execute the query, this time real deletion
        let query2 = `DELETE FROM instructor 
                      WHERE instructor_id = ?`;
        let parameters2 = [instructor_id];
        await conn.execute(query2, parameters2);
        // If all executes are good, commit query
        await conn.commit();
        // Return "success but no response body" (204)
        res.status(204).end();
    } catch (e) {
        // Catch any error
        // If anything goes wrong, undo everything.
        await conn.rollback();
        next(e);
    } finally {
        // Release connection either way
        conn.release();
    }
});

module.exports = router;
