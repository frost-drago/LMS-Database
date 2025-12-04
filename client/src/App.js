import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useParams,
} from 'react-router-dom';

import CoursesPage from './pages/CoursesPage';
import PeoplePage from './pages/PeoplePage';
import StudentsPage from './pages/StudentsPage';
import InstructorsPage from './pages/InstructorsPage';
import TermsPage from './pages/TermsPage';
import ClassOfferingsPage from './pages/ClassOfferingsPage';
import TeachingAssignmentsPage from './pages/TeachingAssignmentsPage';
import ClassSessionsPage from './pages/ClassSessionsPage';
import EnrolmentsPage from './pages/EnrolmentsPage';
import GradesAttendancePage from './pages/GradesAttendancePage';

import './App.css';

// Convert nav style function → returns className
const navStyle = ({ isActive }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

// --- New: SelectUserPage (landing screen) ---
function SelectUserPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [instructorId, setInstructorId] = useState('');

  const goAdmin = () => navigate('/courses');
  const goStudent = () => {
    const trimmed = studentId.trim();
    if (trimmed) navigate(`/${trimmed}/homepage`);
  };
  const goInstructor = () => {
    const trimmed = instructorId.trim();
    if (trimmed) navigate(`/${trimmed}/homepage`);
  };

  return (
    <div className="container-box">
      <h1 className="title">Select User</h1>
      <p className="subtitle">Choose how you want to enter the LMS.</p>

      {/* Admin */}
      <div className="section-block">
        <button onClick={goAdmin} className="btn btn-admin">Admin</button>
      </div>

      {/* Student */}
      <div className="section-block">
        <button onClick={goStudent} className="btn btn-student">Student</button>
        <input
          type="text"
          placeholder="Enter student_id (e.g. S0001)"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="input-field"
        />
      </div>

      {/* Instructor */}
      <div className="section-block">
        <button onClick={goInstructor} className="btn btn-instructor">Instructor</button>
        <input
          type="text"
          placeholder="Enter instructor_id (e.g. I0001)"
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
          className="input-field"
        />
      </div>
    </div>
  );
}

// --- New: StudentHomepage ---
function StudentHomepage() {
  const { student_id } = useParams();
  return (
    <div className="container-centered">
      <h1 className="title">Student Homepage</h1>
      <p className="subtitle">Welcome, student ID: <strong>{student_id}</strong></p>
      <p className="placeholder-text">
        This is where you can later show student-specific data (e.g. enrolments, grades).
      </p>
    </div>
  );
}

// --- New: InstructorHomepage ---
function InstructorHomepage() {
  const { instructor_id } = useParams();
  return (
    <div className="container-centered">
      <h1 className="title">Instructor Homepage</h1>
      <p className="subtitle">Welcome, instructor ID: <strong>{instructor_id}</strong></p>
      <p className="placeholder-text">
        This is where you can later show instructor-specific data.
      </p>
    </div>
  );
}

// --- Admin layout ---
function AdminLayout() {
  return (
    <div className="container-centered">
      <h1 className="title">LMS Admin</h1>

      <div className="nav-row">
        <NavLink to="/courses" className={navStyle}>Courses</NavLink>
        <NavLink to="/people" className={navStyle}>People</NavLink>
        <NavLink to="/students" className={navStyle}>Students</NavLink>
        <NavLink to="/instructors" className={navStyle}>Instructors</NavLink>
        <NavLink to="/terms" className={navStyle}>Terms</NavLink>
        <NavLink to="/class-offerings" className={navStyle}>Class Offerings</NavLink>
        <NavLink to="/teaching-assignments" className={navStyle}>Teaching Assignments</NavLink>
        <NavLink to="/class-sessions" className={navStyle}>Class Sessions</NavLink>
        <NavLink to="/enrolments" className={navStyle}>Enrolments</NavLink>
        <NavLink to="/grades-attendance" className={navStyle}>Grades and Attendance</NavLink>
      </div>

      <Routes>
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/instructors" element={<InstructorsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/class-offerings" element={<ClassOfferingsPage />} />
        <Route path="/teaching-assignments" element={<TeachingAssignmentsPage />} />
        <Route path="/class-sessions" element={<ClassSessionsPage />} />
        <Route path="/enrolments" element={<EnrolmentsPage />} />
        <Route path="/grades-attendance" element={<GradesAttendancePage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SelectUserPage />} />
        <Route path="/:student_id/homepage" element={<StudentHomepage />} />
        <Route path="/:instructor_id/homepage" element={<InstructorHomepage />} />
        <Route path="/*" element={<AdminLayout />} />
      </Routes>
    </Router>
  );
}
