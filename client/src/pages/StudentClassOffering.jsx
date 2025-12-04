// src/pages/StudentClassOffering.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function StudentClassOffering() {
  const { student_id } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch(
          `http://localhost:4000/api/class-offerings/by-student/${encodeURIComponent(
            student_id
          )}`
        );

        if (!res.ok) {
          setError('Failed to load class offerings.');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setClasses(data);
      } catch (err) {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    }

    loadClasses();
  }, [student_id]);

  const handleViewSessions = (co) => {
    navigate(
      `/student/${encodeURIComponent(
        student_id
      )}/class-offerings/${co.class_offering_id}/sessions`,
      {
        state: { classOffering: co }, // pass info for nice title
      }
    );
  };

  return (
    <div className="container-centered">
      <h1 className="title">My Class Offerings</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && classes.length === 0 && (
        <p className="placeholder-text">No enrolments found.</p>
      )}

      {!loading && classes.length > 0 && (
        <div className="list-container">
          {classes.map((co) => (
            <div key={co.class_offering_id} className="list-card">
              <h3 className="card-title">
                {co.course_code} — {co.course_name}
              </h3>
              <p className="card-text">
                <strong>Term:</strong> {co.term_label}
                <br />
                <strong>Class Group:</strong> {co.class_group}
                <br />
                <strong>Class Type:</strong> {co.class_type}
                <br />
                <strong>Status:</strong> {co.enrolment_status}
                <br />
                <strong>Enrolled at:</strong> {co.enroled_at ?? '-'}
              </p>
              <button
                type="button"
                className="nav-link"
                onClick={() => handleViewSessions(co)}
              >
                View Sessions
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
