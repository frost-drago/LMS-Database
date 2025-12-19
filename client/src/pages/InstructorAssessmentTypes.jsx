// src/pages/InstructorAssessmentTypes.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import './Styles.css';

export default function InstructorAssessmentTypes() {
  const { instructor_id, class_offering_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // We pass this from InstructorTeachingAssignments for nice titles + course_code.
  const classOffering = location.state?.classOffering || null;

  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAssessmentTypes() {
      try {
        if (!classOffering?.course_code) {
          setError('Missing course_code for this class offering.');
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://localhost:4000/api/assessment-types?course_code=${encodeURIComponent(
            classOffering.course_code
          )}`
        );

        if (!res.ok) {
          setError('Failed to load assessment types.');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    }

    loadAssessmentTypes();
  }, [classOffering]);

  const handleViewGrades = (assessment) => {
    // This is the "another page" you mentioned.
    // We'll route to it now; you can build the page next.
    navigate(
      `/instructor/${encodeURIComponent(
        instructor_id
      )}/class-offerings/${encodeURIComponent(
        class_offering_id
      )}/assessment-types/${encodeURIComponent(assessment.assessment_id)}/grades`,
      {
        state: { classOffering, assessmentType: assessment },
      }
    );
  };

  return (
    <div className="container-centered">
      <h1 className="title">Assessment Types</h1>

      {classOffering && (
        <p className="subtitle">
          <strong>{classOffering.course_code}</strong> — {classOffering.course_name}
          <br />
          <strong>Class Offering ID:</strong> {class_offering_id}
        </p>
      )}

      {loading && <p>Loading.</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="placeholder-text">No assessment types found for this course.</p>
      )}

      {!loading && !error && rows.length > 0 && (
        <div style={{ width: '100%', maxWidth: 900 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #444' }}>
                  Assessment Type
                </th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #444' }}>
                  Weight (%)
                </th>
                <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #444' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.assessment_id}>
                  <td style={{ padding: 10, borderBottom: '1px solid #333' }}>
                    {a.assessment_type}
                  </td>
                  <td style={{ padding: 10, borderBottom: '1px solid #333' }}>{a.weight}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #333' }}>
                    <button
                      type="button"
                      className="nav-link"
                      onClick={() => handleViewGrades(a)}
                    >
                      View Students&apos; Grades
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button type="button" className="nav-link" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    </div>
  );
}
