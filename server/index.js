require('dotenv').config();
const express = require('express');
const cors = require('cors');

const courses = require('./routes/courses');
const people = require('./routes/people');
const students = require('./routes/students');
const instructors = require('./routes/instructors');
const terms = require('./routes/terms');
const classOfferings = require('./routes/class_offerings');
const teachingAssignments = require('./routes/teaching_assignment');
const classSessions = require('./routes/class_session');
const enrolments = require('./routes/enrolments');
const attendance = require('./routes/attendance');
const assessmentType = require('./routes/assessment_type');
const grade = require('./routes/grade');


const authRouter = require('./routes/auth');


const app = express();
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/courses', courses);
app.use('/api/people', people);
app.use('/api/students', students);
app.use('/api/instructors', instructors);
app.use('/api/terms', terms);
app.use('/api/class-offerings', classOfferings);
app.use('/api/teaching-assignments', teachingAssignments);
app.use('/api/class-sessions', classSessions);
app.use('/api/enrolments', enrolments);
app.use('/api/attendance', attendance);
app.use('/api/assessment-types', assessmentType);
app.use('/api/grades', grade);

app.use('/auth', authRouter);

// Error guard
app.use((err, _req, res, _next) => {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Duplicate/unique constraint' });
    return res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on :${PORT}`));
