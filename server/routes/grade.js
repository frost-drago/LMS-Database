// routes/grade.js
const router = require('express').Router();
const { pool } = require('../db');

/*
TABLE: grade(grade_id PK, enrolment_id FK, score, assessment_id FK)
Base path suggestion: /grades
*/

router.get('/student/:student_id/class-offering/:class_offering_id', async (req, res) => {
    const { student_id, class_offering_id } = req.params;

    try {
        // Find enrolment + course_code for this student in this class offering
        const [enrolRows] = await pool.execute(
        `
        SELECT e.enrolment_id, co.course_code, c.course_name
        FROM enrolment e
        JOIN class_offering co ON co.class_offering_id = e.class_offering_id
        JOIN course c ON c.course_code = co.course_code
        WHERE e.student_id = ? AND e.class_offering_id = ?
        LIMIT 1
        `,
        [student_id, class_offering_id]
        );

        if (!enrolRows.length) {
        return res.status(404).json({ message: 'Student not enrolled in this class offering' });
        }

        const { enrolment_id, course_code, course_name } = enrolRows[0];

        // List all assessment components for the course + student's grade if exists
        const [rows] = await pool.execute(
        `
        SELECT
            at.assessment_id,
            at.assessment_type,
            at.weight,
            g.grade_id,
            g.score,
            CASE
            WHEN g.score IS NULL THEN NULL
            ELSE ROUND(g.score * at.weight / 100, 2)
            END AS weighted_score
        FROM assessment_type at
        LEFT JOIN grade g
            ON g.assessment_id = at.assessment_id
        AND g.enrolment_id = ?
        WHERE at.course_code = ?
        ORDER BY at.assessment_type ASC
        `,
        [enrolment_id, course_code]
        );

        // Compute total weighted score over available grades
        const total_weighted = rows.reduce((sum, r) => sum + (Number(r.weighted_score) || 0), 0);

        res.json({
        class_offering_id: Number(class_offering_id),
        course_code,
        course_name,
        enrolment_id,
        total_weighted: Number(total_weighted.toFixed(2)),
        components: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// CREATE
// POST /grades
router.post('/', async (req, res, next) => {
    try {
        const { enrolment_id, assessment_id, score } = req.body;

        const [r] = await pool.execute(
            `
            INSERT INTO grade (enrolment_id, assessment_id, score)
            VALUES (?, ?, ?)
            `,
            [enrolment_id, assessment_id ?? null, score]
        );

        const [rows] = await pool.execute(
            `SELECT * FROM grade WHERE grade_id = ?`,
            [r.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// READ (filters)
// GET /grades?enrolment_id=...&assessment_id=...
router.get('/', async (req, res, next) => {
    try {
        const { enrolment_id, assessment_id, class_offering_id, course_code } = req.query;

        let sql = `
            SELECT
                g.grade_id,
                g.enrolment_id,
                g.assessment_id,
                g.score,

                -- assessment info
                at.course_code,
                at.assessment_type,
                at.weight,

                -- student info
                e.student_id,
                e.class_offering_id,
                e.enrolment_status,
                p.full_name AS student_name,
                p.email AS student_email

            FROM grade g
            JOIN enrolment e ON e.enrolment_id = g.enrolment_id
            JOIN student s ON s.student_id = e.student_id
            JOIN person p ON p.person_id = s.person_id
            LEFT JOIN assessment_type at ON at.assessment_id = g.assessment_id
            WHERE 1=1
        `;

        const params = [];

        if (enrolment_id) {
            sql += ` AND g.enrolment_id = ?`;
            params.push(enrolment_id);
        }
        if (assessment_id) {
            sql += ` AND g.assessment_id = ?`;
            params.push(assessment_id);
        }
        if (class_offering_id) {
            sql += ` AND e.class_offering_id = ?`;
            params.push(class_offering_id);
        }
        if (course_code) {
            sql += ` AND at.course_code = ?`;
            params.push(course_code);
        }

        sql += ` ORDER BY p.full_name, g.grade_id`;

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

// READ: all grades for one class offering
// GET /grades/by-class-offering/:class_offering_id
router.get('/by-class-offering/:class_offering_id', async (req, res, next) => {
    try {
        const { class_offering_id } = req.params;

        const sql = `
            SELECT
                g.grade_id,
                g.enrolment_id,
                g.assessment_id,
                g.score,

                at.course_code,
                at.assessment_type,
                at.weight,

                e.student_id,
                e.class_offering_id,
                e.enrolment_status,
                p.full_name AS student_name,
                p.email AS student_email
            FROM grade g
            JOIN enrolment e ON e.enrolment_id = g.enrolment_id
            JOIN student s ON s.student_id = e.student_id
            JOIN person p ON p.person_id = s.person_id
            LEFT JOIN assessment_type at ON at.assessment_id = g.assessment_id
            WHERE e.class_offering_id = ?
            ORDER BY p.full_name, g.grade_id
        `;

        const [rows] = await pool.execute(sql, [class_offering_id]);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

// UPDATE
// PUT /grades/:grade_id
router.put('/:grade_id', async (req, res, next) => {
    try {
        const { grade_id } = req.params;
        const { enrolment_id, assessment_id, score } = req.body;

        const [r] = await pool.execute(
            `
            UPDATE grade
            SET enrolment_id = COALESCE(?, enrolment_id),
                    assessment_id = COALESCE(?, assessment_id),
                    score = COALESCE(?, score)
            WHERE grade_id = ?
            `,
            [enrolment_id ?? null, assessment_id ?? null, score ?? null, grade_id]
        );

        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

        const [rows] = await pool.execute(
            `SELECT * FROM grade WHERE grade_id = ?`,
            [grade_id]
        );

        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// DELETE
// DELETE /grades/:grade_id
router.delete('/:grade_id', async (req, res, next) => {
    try {
        const { grade_id } = req.params;

        const [r] = await pool.execute(`DELETE FROM grade WHERE grade_id = ?`, [grade_id]);
        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

        res.status(204).end();
    } catch (e) {
        next(e);
    }
});

module.exports = router;
