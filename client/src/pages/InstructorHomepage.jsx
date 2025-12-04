// src/InstructorHomepage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export default function InstructorHomepage() {
  const { instructor_id } = useParams();
  const location = useLocation();

  // If navigation passed data (navigate(... { state: { instructor: data } }))
  const [instructor, setInstructor] = useState(location.state?.instructor || null);
  const [error, setError] = useState('');

  // Fetch if user refreshed or state is missing
  useEffect(() => {
    if (!instructor) {
      (async () => {
        try {
          const res = await fetch(
            `http://localhost:4000/auth/instructor/${encodeURIComponent(instructor_id)}`
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

  // Error state
  if (error) {
    return (
      <div className="container-centered">
        <h1 className="title">Instructor Homepage</h1>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  // Loading state
  if (!instructor) {
    return (
      <div className="container-centered">
        <h1 className="title">Instructor Homepage</h1>
        <p>Loading...</p>
      </div>
    );
  }

  // Success state
  return (
    <div className="container-centered">
      <h1 className="title">Instructor Homepage</h1>

      <p className="subtitle">
        Welcome, instructor ID: <strong>{instructor.instructor_id}</strong>
      </p>

      <p className="placeholder-text">
        <strong>Full name:</strong> {instructor.full_name}<br />
        <strong>Email:</strong> {instructor.email}
      </p>
    </div>
  );
}
