// src/Instructor.js
import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useLocation, useParams } from 'react-router-dom';

import InstructorTeachingAssignments from './pages/InstructorTeachingAssignments';
import InstructorClassSessions from './pages/InstructorClassSessions';
import InstructorSessionAttendance from './pages/InstructorSessionAttendance';
import InstructorAssessmentTypes from './pages/InstructorAssessmentTypes';
import InstructorGradebook from './pages/InstructorGradebook';


const navStyle = ({ isActive }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link';

export default function Instructor() {
  const { instructor_id } = useParams();
  const location = useLocation();
  const [instructor, setInstructor] = useState(location.state?.instructor || null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!instructor) {
      (async () => {
        try {
          const res = await fetch(
            `http://localhost:4000/auth/instructor/${encodeURIComponent(
              instructor_id
            )}`
          );
          if (!res.ok) {
            setError('Instructor not found.');
            return;
          }
          const data = await res.json();
          setInstructor(data);
        } catch (err) {
          setError('Failed to load instructor data.');
        }
      })();
    }
  }, [instructor, instructor_id]);

  if (error) {
    return (
      <div className="container-centered">
        <h1 className="title">Instructor Homepage</h1>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (!instructor) {
    return (
      <div className="container-centered">
        <h1 className="title">Instructor Homepage</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-centered">
      <h1 className="title">Instructor Homepage</h1>
      <p className="subtitle">
        Welcome, instructor ID: <strong>{instructor.instructor_id}</strong>
      </p>
      <p className="placeholder-text">
        <strong>Full name:</strong> {instructor.full_name}
        <br />
        <strong>Email:</strong> {instructor.email}
      </p>

      {/* --- Navigation buttons --- */}
      <div className="nav-row">
        <div className="nav-row">
          <NavLink
            to={`/instructor/${encodeURIComponent(instructor_id)}/teaching-assignments`}
            className={navStyle}
          >
            Teaching Assignments
          </NavLink>
        </div>

      </div>

      {/* --- Instructor sub-routes --- */}
      <Routes>
        <Route
          path="teaching-assignments"
          element={<InstructorTeachingAssignments />}
        />
        {/* ✅ NEW: this connects the "View Sessions" button */}
        <Route
          path="class-offerings/:class_offering_id/sessions"
          element={<InstructorClassSessions />}
        />
        <Route
          path="class-offerings/:class_offering_id/sessions/:session_id/attendance"
          element={<InstructorSessionAttendance />}
        />
        <Route
          path="class-offerings/:class_offering_id/assessment-types"
          element={<InstructorAssessmentTypes />}
        />
        <Route
          path="class-offerings/:class_offering_id/assessment-types/:assessment_id/grades"
          element={<InstructorGradebook />}
        />
      </Routes>
    </div>
  );
}
