// src/Admin.js
import React from 'react';
import { NavLink, Routes, Route } from 'react-router-dom';

import CoursesPage from './pages/CoursesPage';
import PeoplePage from './pages/PeoplePage';
import StudentsPage from './pages/StudentsPage';
import InstructorsPage from './pages/InstructorsPage';
import TermsPage from './pages/TermsPage';
import ClassOfferingsPage from './pages/ClassOfferingsPage';
import TeachingAssignmentsPage from './pages/TeachingAssignmentsPage';
import ClassSessionsPage from './pages/ClassSessionsPage';
import EnrolmentsPage from './pages/EnrolmentsPage';
import AttendancePage from './pages/AttendancePage';
import AssessmentTypesPage from './pages/AssessmentTypesPage';
import GradesPage from './pages/GradesPage';

const navStyle = ({ isActive }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link';

export default function Admin() {
  return (
    <div className="container-centered">
      <h1 className="title">LMS Admin</h1>

      <div className="nav-row">
        <NavLink to="/admin/courses" className={navStyle}>Courses</NavLink>
        <NavLink to="/admin/people" className={navStyle}>People</NavLink>
        <NavLink to="/admin/students" className={navStyle}>Students</NavLink>
        <NavLink to="/admin/instructors" className={navStyle}>Instructors</NavLink>
        <NavLink to="/admin/terms" className={navStyle}>Terms</NavLink>
        <NavLink to="/admin/class-offerings" className={navStyle}>Class Offerings</NavLink>
        <NavLink to="/admin/teaching-assignments" className={navStyle}>Teaching Assignments</NavLink>
        <NavLink to="/admin/class-sessions" className={navStyle}>Class Sessions</NavLink>
        <NavLink to="/admin/enrolments" className={navStyle}>Enrolments</NavLink>
        <NavLink to="/admin/attendance" className={navStyle}>Attendance</NavLink>
        <NavLink to="/admin/asessment-types" className={navStyle}>Assessment Types</NavLink>
        <NavLink to="/admin/grades" className={navStyle}>Grades</NavLink>
      </div>

      <Routes>
        <Route path="courses" element={<CoursesPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="instructors" element={<InstructorsPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="class-offerings" element={<ClassOfferingsPage />} />
        <Route path="teaching-assignments" element={<TeachingAssignmentsPage />} />
        <Route path="class-sessions" element={<ClassSessionsPage />} />
        <Route path="enrolments" element={<EnrolmentsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="asessment-types" element={<AssessmentTypesPage />} />
        <Route path="grades" element={<GradesPage />} />
      </Routes>
    </div>
  );
}
