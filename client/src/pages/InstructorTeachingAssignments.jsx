// src/pages/InstructorTeachingAssignments.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Styles.css';

export default function InstructorTeachingAssignments() {
  const { instructor_id } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Add this new handler inside InstructorTeachingAssignments.jsx
  const handleViewAssessmentTypes = (co) => {
    navigate(
      `/instructor/${encodeURIComponent(
        instructor_id
      )}/class-offerings/${co.class_offering_id}/assessment-types`,
      {
        state: { classOffering: co },
      }
    );
  };


  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch(
          `http://localhost:4000/api/class-offerings/by-instructor/${encodeURIComponent(
            instructor_id
          )}`
        );

        if (!res.ok) {
          setError('Failed to load teaching assignments.');
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

    // ✅ Guard against missing param (wrong route param name)
    if (instructor_id) {
      loadClasses();
    } else {
      setError('No instructor_id found in URL.');
      setLoading(false);
    }
  }, [instructor_id]);

  const handleViewSessions = (co) => {
    // This is fine as long as you later define this route in App/Instructor.
    navigate(
      `/instructor/${encodeURIComponent(
        instructor_id
      )}/class-offerings/${co.class_offering_id}/sessions`,
      {
        state: { classOffering: co }, // pass info for nice title
      }
    );
  };

  return (
    <div className="container-centered">
      <h1 className="title">My Teaching Assignments</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && classes.length === 0 && (
        <p className="placeholder-text">No teaching assignments found.</p>
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
                <strong>Role:</strong> {co.teaching_role}
              </p>
              <button
                type="button"
                className="nav-link"
                onClick={() => handleViewSessions(co)}
              >
                View Sessions
              </button>
              <button
                type="button"
                className="nav-link"
                onClick={() => handleViewAssessmentTypes(co)}
              >
                Grading
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
