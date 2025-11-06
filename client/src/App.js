import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import CoursesPage from './pages/CoursesPage';
import StudentsPage from './pages/StudentsPage';
import ClassOfferingsPage from './pages/ClassOfferingsPage';
import EnrolmentsPage from './pages/EnrolmentsPage';

export default function App() {
  const navStyle = ({ isActive }) => ({
    padding: '8px 12px',
    borderRadius: 8,
    textDecoration: 'none',
    color: isActive ? 'white' : '#333',
    background: isActive ? '#111' : '#eee',
    marginRight: 8
  });

  return (
    <Router>
      <div style={{ maxWidth: 960, margin: '24px auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ marginBottom: 8 }}>LMS Admin</h1>
        <div style={{ marginBottom: 16 }}>
          <NavLink to="/courses" style={navStyle}>Courses</NavLink>
          <NavLink to="/students" style={navStyle}>Students</NavLink>
          <NavLink to="/class-offerings" style={navStyle}>Class Offerings</NavLink>
          <NavLink to="/enrolments" style={navStyle}>Enrolments</NavLink>
        </div>

        <Routes>
          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/class-offerings" element={<ClassOfferingsPage />} />
          <Route path="/enrolments" element={<EnrolmentsPage />} />
        </Routes>
      </div>
    </Router>
  );
}
