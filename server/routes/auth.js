// routes/auth.js
const router = require('express').Router();
const { pool } = require('../db');

// GET /auth/student/:student_id
router.get('/student/:student_id', async (req, res, next) => {
    try {
        const { student_id } = req.params;

        const [rows] = await pool.execute(
            `SELECT 
                s.student_id,
                s.cohort,
                p.full_name,
                p.email
            FROM student s
            JOIN person p ON p.person_id = s.person_id
            WHERE s.student_id = ?`,
            [student_id]
        );

        if (rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

// GET /auth/instructor/:instructor_id
router.get('/instructor/:instructor_id', async (req, res, next) => {
    try {
        const { instructor_id } = req.params;

        const [rows] = await pool.execute(
            `SELECT 
                i.instructor_id,
                p.full_name,
                p.email
            FROM instructor i
            JOIN person p ON p.person_id = i.person_id
            WHERE i.instructor_id = ?`,
            [instructor_id]
        );

        if (rows.length === 0) {
        return res.status(404).json({ error: 'Instructor not found' });
        }

        res.json(rows[0]);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
