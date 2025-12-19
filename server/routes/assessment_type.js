// routes/assessmentType.js
const router = require('express').Router();
const { pool } = require('../db');

/*
TABLE: assessment_type(assessment_id PK, course_code FK, assessment_type, weight, UNIQUE(course_code, assessment_type))
Base path suggestion: /assessment-types
*/

// CREATE
// POST /assessment-types
router.post('/', async (req, res, next) => {
    try {
        const { course_code, assessment_type, weight } = req.body;

        const [r] = await pool.execute(
            `
            INSERT INTO assessment_type (course_code, assessment_type, weight)
            VALUES (?, ?, ?)
            `,
            [course_code, assessment_type, weight]
        );

        const [rows] = await pool.execute(
            `SELECT * FROM assessment_type WHERE assessment_id = ?`,
            [r.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// READ (filters)
// GET /assessment-types?course_code=...&assessment_type=...
router.get('/', async (req, res, next) => {
    try {
        const { course_code, assessment_type } = req.query;

        let sql = `
            SELECT
                at.assessment_id,
                at.course_code,
                c.course_name,
                at.assessment_type,
                at.weight
            FROM assessment_type at
            LEFT JOIN course c ON c.course_code = at.course_code
            WHERE 1=1
        `;
        const params = [];

        if (course_code) {
            sql += ` AND at.course_code = ?`;
            params.push(course_code);
        }
        if (assessment_type) {
            sql += ` AND at.assessment_type = ?`;
            params.push(assessment_type);
        }

        sql += ` ORDER BY at.course_code, at.assessment_type`;

        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

// READ: one
// GET /assessment-types/:assessment_id
router.get('/:assessment_id', async (req, res, next) => {
    try {
        const { assessment_id } = req.params;

        const [rows] = await pool.execute(
            `
            SELECT
                at.*,
                c.course_name
            FROM assessment_type at
            LEFT JOIN course c ON c.course_code = at.course_code
            WHERE at.assessment_id = ?
            `,
            [assessment_id]
        );

        if (!rows.length) return res.status(404).json({ error: 'Not found' });
        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// UPDATE
// PUT /assessment-types/:assessment_id
router.put('/:assessment_id', async (req, res, next) => {
    try {
        const { assessment_id } = req.params;
        const { course_code, assessment_type, weight } = req.body;

        const [r] = await pool.execute(
            `
            UPDATE assessment_type
            SET course_code = COALESCE(?, course_code),
                    assessment_type = COALESCE(?, assessment_type),
                    weight = COALESCE(?, weight)
            WHERE assessment_id = ?
            `,
            [course_code ?? null, assessment_type ?? null, weight ?? null, assessment_id]
        );

        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

        const [rows] = await pool.execute(
            `SELECT * FROM assessment_type WHERE assessment_id = ?`,
            [assessment_id]
        );

        res.json(rows[0]);
    } catch (e) {
        next(e);
    }
});

// DELETE
// DELETE /assessment-types/:assessment_id
router.delete('/:assessment_id', async (req, res, next) => {
    try {
        const { assessment_id } = req.params;

        const [r] = await pool.execute(
            `DELETE FROM assessment_type WHERE assessment_id = ?`,
            [assessment_id]
        );

        if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
        res.status(204).end();
    } catch (e) {
        next(e);
    }
});

module.exports = router;
