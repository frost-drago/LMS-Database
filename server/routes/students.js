const router = require('express').Router();
const { pool } = require('../db');

// NOTE TO SELF. Inputs can come from:
// - req.body → JSON from client (POST/PUT/PATCH)
// - req.params → /:id segments in the URL
// - req.query → ?q=search etc.

// backticks are template literals

/* 
When we create a student, we actually write to two tables:
- person
- student (FK depends on person_id)
If the first INSERT succeeds and second INSERT fails:
- We would end up with a dangling person row without a matching student row
- That breaks the data integrity
- Makes the DB inconsistent
So we need a transaction.
*/

// CREATE student (from existing person)
// [POST /students/from-person]
router.post('/from-person', async (req, res, next) => {
    // Manually claim a connection because a transaction is needed
    const conn = await pool.getConnection();
    try {
        // Get data from the request body
        const { person_id, student_id, cohort } = req.body;

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
        // Execute query. Insert student row
        let query2 = `INSERT INTO student (person_id, student_id, cohort) 
                      VALUES
                      (?, ?, ?)`;
        let parameters2 = [person_id, student_id, cohort ?? null];
        await conn.execute(query2, parameters2);

        // If both executes are good, commit query.
        await conn.commit();

        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data.
        let query3 = `SELECT s.person_id, s.student_id, s.cohort, p.full_name, p.email
                      FROM student s JOIN person p ON p.person_id = s.person_id
                      WHERE s.student_id = ?`;
        let parameters3 = [student_id];
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

// CREATE student (also create person)
// [POST /students]
router.post('/', async (req, res, next) => {
    // Manually claim a connection because a transaction is needed
    const conn = await pool.getConnection();
    try {
        // Get data from the request body
        const { full_name, email, student_id, cohort } = req.body;

        // Begin a transaction
        await conn.beginTransaction();

        // Execute query. Make person first.
        let query = `INSERT INTO person (full_name, email) 
                     VALUES 
                     (?, ?)`;
        let parameters = [full_name, email];
        const [p] = await conn.execute(query, parameters);
        const person_id = p.insertId;
        // Execute query. Make student after making a person.
        let query2 = `INSERT INTO student (person_id, student_id, cohort) 
                      VALUES 
                      (?, ?, ?)`;
        let parameters2 = [person_id, student_id, cohort ?? null];
        await conn.execute(query2, parameters2);

        // If both executes are good, commit query. 
        await conn.commit();

        // Fetch the inserted row
        // Just for best practices and to prevent DB from lying about the data.
        let query3 = `SELECT s.person_id, s.student_id, s.cohort, pe.full_name, pe.email
                      FROM student s JOIN person pe ON pe.person_id = s.person_id
                      WHERE s.student_id = ?`;
        let parameters3 = [student_id];
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

// READ students (join person)
// [GET /students]
router.get('/', async (_req, res, next) => {
    try {
        let query = `SELECT s.person_id, s.student_id, s.cohort, p.full_name, p.email
                     FROM student s JOIN person p ON p.person_id = s.person_id
                     ORDER BY s.student_id`
        const [rows] = await pool.execute(query);
        // Return rows
        res.json(rows);
    } catch (e) { 
        // Catch any error
        next(e); 
    }
});

// UPDATE (can update both person + student)
// [PUT /students]
router.put('/:student_id', async (req, res, next) => {
    // Manually claim a connection because a transaction is needed
    const conn = await pool.getConnection();
    try {
        // Get data from the request parameter
        const { student_id } = req.params;
        // Get data from the request body
        const { full_name, email, cohort } = req.body;

        // Begin a transaction
        await conn.beginTransaction();
        // Execute the query, find person_id first
        let query = `SELECT person_id FROM student 
                     WHERE student_id = ?`;
        let parameters = [student_id];
        const [sRows] = await conn.execute(query, parameters);
        // If student does NOT exist (prevents updating ghost student)
        if (!sRows.length) { 
            await conn.rollback(); 
            return res.status(404).json({ error: 'Not found' }); 
        }

        // Save person_id for use later
        const person_id = sRows[0].person_id;

        // Update person if provided
        if (full_name != null || email != null) {
            // Execute query. Use COALESCE to put in input if not null
            let query2 = `UPDATE person 
                          SET full_name = COALESCE(?, full_name), email = COALESCE(?, email)
                          WHERE person_id = ?`;
            let parameters2 = [full_name ?? null, email ?? null, person_id];
            await conn.execute(query2, parameters2);
        }
        // Update student if provided
        if (cohort != null) {
            // Execute query
            let query3 = `UPDATE student 
                          SET cohort = ? 
                          WHERE student_id = ?`;
            let parameters3 = [cohort, student_id];
            await conn.execute(query3, parameters3);
        }
        // If all executes are good, commit query. 
        await conn.commit();

        // Execute the query. Return the updated row. This is to see whether info is correct or not.
        let query4 = `SELECT s.person_id, s.student_id, s.cohort, p.full_name, p.email 
                      FROM student s JOIN person p ON p.person_id = s.person_id
                      WHERE s.student_id = ?`;
        let parameters4 = [student_id];
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
// [DELETE /students/:student_id]
router.delete('/:student_id', async (req, res, next) => {
    // Manually claim a connection because a transaction is needed
    const conn = await pool.getConnection();
    try {
        // Get data from the request parameter
        const { student_id } = req.params;
        // Begin a transaction
        await conn.beginTransaction();
        // Execute the query. 
        let query = `SELECT person_id 
                     FROM student 
                     WHERE student_id = ?`;
        let parameters = [student_id];
        // Get person_id. Additionally see if the student exist or not.
        const [sRows] = await conn.execute(query, parameters);
        if (!sRows.length) {
            await conn.rollback();
            return res.status(404).json({ error: 'Not found' });
        }
        const person_id = sRows[0].person_id;
        // Execute the query, this time real deletion
        let query2 = `DELETE FROM student 
                      WHERE student_id = ?`;
        let parameters2 = [student_id];
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
