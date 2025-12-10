// src/pages/InstructorSessionAttendance.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

const ATTENDANCE_OPTIONS = ['Verified', 'Pending', 'Not attended'];

export default function InstructorSessionAttendance() {
  const { instructor_id, class_offering_id, session_id } = useParams();
  const location = useLocation();

  // Optional context from navigation state
  const classOffering = location.state?.classOffering || null;
  const session = location.state?.session || null;

  const [rows, setRows] = useState([]);

  // filters (within this session only)
  const [filterEnrolmentId, setFilterEnrolmentId] = useState('');

  // create (session_id is fixed from URL)
  const [enrolment_id, setEnrolmentId] = useState('');
  const [assessment_type, setAssessmentType] = useState('');
  const [score, setScore] = useState('');
  const [weight, setWeight] = useState('');
  const [attendance_status, setAttendanceStatus] = useState('Not attended');

  // edit
  const [editingId, setEditingId] = useState(null);
  const [eAssessmentType, setEAssessmentType] = useState('');
  const [eScore, setEScore] = useState('');
  const [eWeight, setEWeight] = useState('');
  const [eAttendanceStatus, setEAttendanceStatus] = useState('Not attended');

  async function load(params = {}) {
    try {
      const fullParams = {
        ...params,
        session_id, // always scope to this session
      };
      const { data } = await api.get('/grades-attendance', { params: fullParams });
      setRows(data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  useEffect(() => {
    if (session_id) {
      load();
    }
  }, [session_id]);

  async function applyFilter(e) {
    if (e) e.preventDefault();
    const params = {};
    if (filterEnrolmentId) params.enrolment_id = filterEnrolmentId;
    await load(params);
  }

  function clearFilter() {
    setFilterEnrolmentId('');
    load();
  }

  async function createRecord(e) {
    e.preventDefault();
    try {
      await api.post('/grades-attendance', {
        enrolment_id,
        session_id, // fixed from URL
        assessment_type,
        score,
        weight,
        attendance_status,
      });

      // clear form
      setEnrolmentId('');
      setAssessmentType('');
      setScore('');
      setWeight('');
      setAttendanceStatus('Not attended');

      applyFilter();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(row) {
    setEditingId(row.record_id);
    setEAssessmentType(row.assessment_type ?? '');
    setEScore(row.score ?? '');
    setEWeight(row.weight ?? '');
    setEAttendanceStatus(row.attendance_status ?? 'Not attended');
  }

  async function saveEdit() {
    try {
      await api.put(`/grades-attendance/${editingId}`, {
        assessment_type: eAssessmentType,
        score: eScore,
        weight: eWeight,
        attendance_status: eAttendanceStatus,
      });
      setEditingId(null);
      applyFilter();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function verifyAllPending() {
    try {
      await api.patch(`/grades-attendance/verify-all/${session_id}`);
      load(); // refresh table
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }


  async function remove(record_id) {
    try {
      await api.delete(`/grades-attendance/${record_id}`);
      applyFilter();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  const headerTitle = classOffering
    ? `${classOffering.course_code} – ${classOffering.course_name}`
    : `Class Offering ID ${class_offering_id}`;
  const headerSubtitle = session
    ? `Session ${session.session_no}: ${session.title || ''} | Instructor ${instructor_id}`
    : `Session ID ${session_id} | Instructor ${instructor_id}`;

  return (
    <div className="students-page">
      <h2>Session Attendance &amp; Grades (Instructor View)</h2>
      <p>
        <strong>{headerTitle}</strong>
        <br />
        {headerSubtitle}
      </p>

      {/* Filter (inside this session) */}
      <form className="form-box" onSubmit={applyFilter}>
        <h3>Filter Records (This Session Only)</h3>
        <div className="form-grid">
          <FormField
            label="Enrolment ID"
            type="number"
            value={filterEnrolmentId}
            onChange={setFilterEnrolmentId}
            placeholder="e.g. 1"
          />
        </div>
        <div className="form-submit">
          <button type="submit">Apply Filter</button>{' '}
          <button type="button" onClick={clearFilter}>
            Clear
          </button>
        </div>
      </form>

      {/* Create */}
      <form className="form-box" onSubmit={createRecord}>
        <h3>Create Grade / Attendance Record for This Session</h3>
        <div className="form-grid">
          <FormField
            label="Enrolment ID"
            type="number"
            value={enrolment_id}
            onChange={setEnrolmentId}
            required
          />
          <FormField
            label="Assessment Type"
            value={assessment_type}
            onChange={setAssessmentType}
            placeholder="e.g. Quiz 1, Midterm"
            required
          />
          <FormField
            label="Score"
            type="number"
            value={score}
            onChange={setScore}
            min="0"
            max="100"
            required
          />
          <FormField
            label="Weight"
            type="number"
            value={weight}
            onChange={setWeight}
            min="0"
            max="100"
            required
          />
          <div className="form-field">
            <label>Attendance Status</label>
            <select
              value={attendance_status}
              onChange={(e) => setAttendanceStatus(e.target.value)}
            >
              {ATTENDANCE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      {/* Verify all pending */}
      <div style={{ marginTop: '20px', marginBottom: '10px' }}>
        <button onClick={verifyAllPending}>
          Verify All Pending Attendance
        </button>
      </div>

      {/* Table */}
      <table className="students-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Record ID</th>
            <th>Student</th>
            <th>Enrolment ID</th>
            <th>Assessment Type</th>
            <th>Score</th>
            <th>Weight</th>
            <th>Attendance Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.record_id}>
              <td>{r.record_id}</td>
              <td>
                {r.student_name} <br />
                <small>{r.student_id}</small>
              </td>
              <td>{r.enrolment_id}</td>
              <td>
                {editingId === r.record_id ? (
                  <input
                    value={eAssessmentType}
                    onChange={(e) => setEAssessmentType(e.target.value)}
                  />
                ) : (
                  r.assessment_type
                )}
              </td>
              <td>
                {editingId === r.record_id ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={eScore}
                    onChange={(e) => setEScore(e.target.value)}
                    style={{ width: '70px' }}
                  />
                ) : (
                  r.score
                )}
              </td>
              <td>
                {editingId === r.record_id ? (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={eWeight}
                    onChange={(e) => setEWeight(e.target.value)}
                    style={{ width: '70px' }}
                  />
                ) : (
                  r.weight
                )}
              </td>
              <td>
                {editingId === r.record_id ? (
                  <select
                    value={eAttendanceStatus}
                    onChange={(e) => setEAttendanceStatus(e.target.value)}
                  >
                    {ATTENDANCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  r.attendance_status
                )}
              </td>
              <td className="actions-cell">
                {editingId === r.record_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)}>Edit</button>{' '}
                    <ConfirmButton
                      confirm="Delete this record?"
                      onClick={() => remove(r.record_id)}
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
              <td colSpan="7" className="no-data">
                No grade/attendance records for this session
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
