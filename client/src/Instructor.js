// src/Instructor.js
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';

export default function Instructor() {
  const { instructor_id } = useParams();
  const location = useLocation();
  const [instructor, setInstructor] = useState(location.state?.instructor || null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!instructor) {
      (async () => {
        try {
          const res = await fetch(`http://localhost:3000/auth/instructor/${encodeURIComponent(instructor_id)}`);
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
        <strong>Full name:</strong> {instructor.full_name}<br />
        <strong>Email:</strong> {instructor.email}
      </p>
    </div>
  );
}
