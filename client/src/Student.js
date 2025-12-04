// src/Student.js
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export default function Student() {
  const { student_id } = useParams();
  const location = useLocation();
  const [student, setStudent] = useState(location.state?.student || null);
  const [error, setError] = useState('');

  useEffect(() => {
    // If we didn't get data via navigation state (e.g. user refreshed),
    // fetch it directly from backend.
    if (!student) {
      (async () => {
        try {
          const res = await fetch(`http://localhost:3000/auth/student/${encodeURIComponent(student_id)}`);
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
        <strong>Full name:</strong> {student.full_name}<br />
        <strong>Email:</strong> {student.email}<br />
        <strong>Cohort:</strong> {student.cohort ?? '-'}
      </p>
    </div>
  );
}
