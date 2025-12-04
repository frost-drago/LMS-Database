import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useParams,
} from 'react-router-dom';

import StudentHomepage from './pages/StudentHomepage';
import InstructorHomepage from './pages/InstructorHomepage';
import Admin from './Admin';

import './App.css';

// Convert nav style function → returns className
const navStyle = ({ isActive }) =>
  isActive ? "nav-link nav-link-active" : "nav-link";

// --- New: SelectUserPage (landing screen) ---
function SelectUserPage() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [instructorId, setInstructorId] = useState('');

  const goAdmin = () => navigate('/admin/courses');

  const goStudent = async () => {
    const trimmed = studentId.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`http://localhost:4000/auth/student/${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        alert("Student ID not found.");
        return;
      }
      const data = await res.json();

      navigate(`/student/${trimmed}/homepage`, { state: { student: data } });

    } catch (err) {
      alert("Failed to connect to server.");
    }
  };

  const goInstructor = async () => {
    const trimmed = instructorId.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`http://localhost:4000/auth/instructor/${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        alert("Instructor ID not found.");
        return;
      }
      const data = await res.json();

      navigate(`/instructor/${trimmed}/homepage`, { state: { instructor: data } });

    } catch (err) {
      alert("Failed to connect to server.");
    }
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

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SelectUserPage />} />
        <Route path="/student/:student_id/homepage" element={<StudentHomepage />} />
        <Route path="/instructor/:instructor_id/homepage" element={<InstructorHomepage />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </Router>
  );
}
