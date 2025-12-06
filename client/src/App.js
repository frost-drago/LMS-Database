import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";

import Student from "./Student";
import Instructor from "./Instructor";
import Admin from "./Admin";

import "./App.css";


// ===========================
// Landing Screen
// ===========================
function SelectUserPage() {
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState("");
  const [instructorId, setInstructorId] = useState("");


  // ---- Admin ----
  const goAdmin = () => {
    navigate("/admin/courses");
  };


  // ---- Student ----
  const goStudent = async () => {
    const trimmed = studentId.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(
        `http://localhost:4000/auth/student/${encodeURIComponent(trimmed)}`
      );
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


  // ---- Instructor ----
  const goInstructor = async () => {
    const trimmed = instructorId.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(
        `http://localhost:4000/auth/instructor/${encodeURIComponent(trimmed)}`
      );
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


  // ===========================
  // UI
  // ===========================
  return (
    <div className="container-box">

      <h1 className="title">Select User</h1>
      <p className="subtitle">Choose how you want to enter the LMS.</p>

      {/* ========= Admin ========= */}
      <div className="section-block">
        <button onClick={goAdmin} className="btn btn-admin">
          Admin
        </button>
      </div>


      {/* ========= Student ========= */}
      <div className="section-block">
        <button onClick={goStudent} className="btn btn-student">
          Student
        </button>

        <input
          type="text"
          placeholder="Enter student ID"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="input-field"
        />
      </div>


      {/* ========= Instructor ========= */}
      <div className="section-block">
        <button onClick={goInstructor} className="btn btn-instructor">
          Instructor
        </button>

        <input
          type="text"
          placeholder="Enter instructor ID"
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
          className="input-field"
        />
      </div>

    </div>
  );
}


// ===========================
// Main App Router
// ===========================
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SelectUserPage />} />

        <Route path="/student/:student_id/*" element={<Student />} />

        <Route path="/instructor/:instructor_id/*" element={<Instructor />} />

        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </Router>
  );
}
