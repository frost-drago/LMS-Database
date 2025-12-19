import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

export default function InstructorGradebook() {
  const { instructor_id, class_offering_id, assessment_id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // passed from InstructorAssessmentTypes.jsx navigate(..., { state: { classOffering, assessmentType } })
  const classOffering = location.state?.classOffering || null;
  const assessmentType = location.state?.assessmentType || null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // editing
  const [editingEnrolmentId, setEditingEnrolmentId] = useState(null);
  const [editScore, setEditScore] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/grades/gradebook', {
        params: {
          class_offering_id: Number(class_offering_id),
          assessment_id: Number(assessment_id),
        },
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [class_offering_id, assessment_id]);

  function startEdit(r) {
    setEditingEnrolmentId(r.enrolment_id);
    setEditScore(r.score ?? 0);
  }

  function cancelEdit() {
    setEditingEnrolmentId(null);
    setEditScore(0);
  }

  async function saveEdit(r) {
    try {
      const scoreNum = Number(editScore);

      // If grade exists -> update, else -> create
      if (r.grade_id) {
        await api.put(`/grades/${r.grade_id}`, {
          enrolment_id: Number(r.enrolment_id),
          assessment_id: Number(r.assessment_id),
          score: scoreNum,
        });
      } else {
        await api.post('/grades', {
          enrolment_id: Number(r.enrolment_id),
          assessment_id: Number(r.assessment_id),
          score: scoreNum,
        });
      }

      setEditingEnrolmentId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function removeGrade(r) {
    try {
      if (!r.grade_id) return;
      await api.delete(`/grades/${r.grade_id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  const titleCourse = classOffering?.course_code || rows[0]?.course_code || '—';
  const titleCourseName = classOffering?.course_name || '—';
  const titleAssessment = assessmentType?.assessment_type || rows[0]?.assessment_type || '—';
  const titleWeight = assessmentType?.weight ?? rows[0]?.weight ?? '—';

  return (
    <div className="courses-page">
      <h2>Gradebook</h2>

      <div className="muted" style={{ marginBottom: 12 }}>
        <div><b>Course:</b> {titleCourse} — {titleCourseName}</div>
        <div><b>Class Offering ID:</b> {class_offering_id}</div>
        <div><b>Assessment:</b> {titleAssessment} (weight: {titleWeight}%)</div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate(-1)}>Back</button>{' '}
        <button onClick={load}>Refresh</button>
      </div>

      {loading ? (
        <p>Loading.</p>
      ) : (
        <table className="courses-table" width="100%" cellPadding="8">
          <thead>
            <tr>
              <th>Student</th>
              <th>Student ID</th>
              <th>Enrolment</th>
              <th>Score (0-100)</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(r => (
              <tr key={r.enrolment_id}>
                <td>
                  <div><b>{r.student_name}</b></div>
                  <div className="muted">{r.student_email || '—'}</div>
                </td>

                <td>{r.student_id}</td>

                <td>
                  <div className="muted">enrolment_id: {r.enrolment_id}</div>
                  <div className="muted">status: {r.enrolment_status}</div>
                </td>

                <td>
                  {editingEnrolmentId === r.enrolment_id ? (
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editScore}
                      onChange={e => setEditScore(e.target.value)}
                      className="credit-input"
                    />
                  ) : (
                    r.score ?? '—'
                  )}
                </td>

                <td className="actions-cell">
                  {editingEnrolmentId === r.enrolment_id ? (
                    <>
                      <button onClick={cancelEdit}>Cancel</button>{' '}
                      <button onClick={() => saveEdit(r)}>Save</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(r)}>
                        {r.grade_id ? 'Edit' : 'Add Grade'}
                      </button>{' '}
                      <ConfirmButton
                        confirm="Delete this grade?"
                        onClick={() => removeGrade(r)}
                        disabled={!r.grade_id}
                      >
                        Delete
                      </ConfirmButton>
                    </>
                  )}
                </td>
              </tr>
            ))}

            {!rows.length && (
              <tr>
                <td colSpan="5" className="no-data">No students found</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
