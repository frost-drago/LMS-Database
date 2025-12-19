// src/Student.js
import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useLocation, useParams } from 'react-router-dom';

import StudentClassOffering from './pages/StudentClassOffering';
import StudentClassSessions from './pages/StudentClassSessions'; 
import StudentGradesSummary from './pages/StudentGradesSummary';
import StudentGradesDetail from './pages/StudentGradesDetail';

const navStyle = ({ isActive }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link';

export default function Student() {
  const { student_id } = useParams();
  const location = useLocation();
  const [student, setStudent] = useState(location.state?.student || null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!student) {
      (async () => {
        try {
          const res = await fetch(
            `http://localhost:4000/auth/student/${encodeURIComponent(
              student_id
            )}`
          );
          if (!res.ok) {
            setError('Student not found.');
            return;
          }
          const data = await res.json();
          setStudent(data);
        } catch (err) {
          setError('Failed to load student data.');
        }
      })();
    }
  }, [student, student_id]);

  if (error) {
    return (
      <div className="container-centered">
        <h1 className="title">Student Homepage</h1>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="container-centered">
        <h1 className="title">Student Homepage</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-centered">
      <h1 className="title">Student Homepage</h1>
      <p className="subtitle">
        Welcome, student ID: <strong>{student.student_id}</strong>
      </p>
      <p className="placeholder-text">
        <strong>Full name:</strong> {student.full_name}
        <br />
        <strong>Email:</strong> {student.email}
        <br />
        <strong>Cohort:</strong> {student.cohort ?? '-'}
      </p>

      {/* --- Navigation buttons --- */}
      <div className="nav-row">
        <NavLink
          to={`/student/${student_id}/class-offerings`}
          className={navStyle}
        >
          Class Offerings
        </NavLink>
      </div>

      {/* --- Student sub-routes --- */}
      <Routes>
        <Route path="class-offerings" element={<StudentClassOffering />} />
        <Route
          path="class-offerings/:class_offering_id/sessions"
          element={<StudentClassSessions />}
        />
        <Route path="grades" element={<StudentGradesSummary />} />
        <Route path="grades/:class_offering_id" element={<StudentGradesDetail />} />
      </Routes>
    </div>
  );
}
