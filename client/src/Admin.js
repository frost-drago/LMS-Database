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
import GradesAttendancePage from './pages/GradesAttendancePage';

const navStyle = ({ isActive }) =>
  isActive ? 'nav-link nav-link-active' : 'nav-link';

export default function Admin() {
  return (
    <div className="container-centered">
      <h1 className="title">LMS Admin</h1>

      <div className="nav-row">
        <NavLink to="courses" className={navStyle}>Courses</NavLink>
        <NavLink to="people" className={navStyle}>People</NavLink>
        <NavLink to="students" className={navStyle}>Students</NavLink>
        <NavLink to="instructors" className={navStyle}>Instructors</NavLink>
        <NavLink to="terms" className={navStyle}>Terms</NavLink>
        <NavLink to="class-offerings" className={navStyle}>Class Offerings</NavLink>
        <NavLink to="teaching-assignments" className={navStyle}>Teaching Assignments</NavLink>
        <NavLink to="class-sessions" className={navStyle}>Class Sessions</NavLink>
        <NavLink to="enrolments" className={navStyle}>Enrolments</NavLink>
        <NavLink to="grades-attendance" className={navStyle}>Grades and Attendance</NavLink>
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
        <Route path="grades-attendance" element={<GradesAttendancePage />} />
      </Routes>
    </div>
  );
}
