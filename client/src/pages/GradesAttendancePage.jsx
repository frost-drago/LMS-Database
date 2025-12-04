// src/pages/GradesAttendancePage.jsx
import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './StudentsPage.css';

const ATTENDANCE_OPTIONS = ['Verified', 'Pending', 'Not attended'];

export default function GradesAttendancePage() {
  const [rows, setRows] = useState([]);

  // filters
  const [filterEnrolmentId, setFilterEnrolmentId] = useState('');
  const [filterSessionId, setFilterSessionId] = useState('');

  // create
  const [enrolment_id, setEnrolmentId] = useState('');
  const [session_id, setSessionId] = useState('');
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
      const { data } = await api.get('/grades-attendance', { params });
      setRows(data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function applyFilter(e) {
    if (e) e.preventDefault();
    const params = {};
    if (filterEnrolmentId) params.enrolment_id = filterEnrolmentId;
    if (filterSessionId) params.session_id = filterSessionId;
    await load(params);
  }

  function clearFilter() {
    setFilterEnrolmentId('');
    setFilterSessionId('');
    load();
  }

  async function createRecord(e) {
    e.preventDefault();
    try {
      await api.post('/grades-attendance', {
        enrolment_id,
        session_id,
        assessment_type,
        score,
        weight,
        attendance_status,
      });

      // clear form
      setEnrolmentId('');
      setSessionId('');
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

  async function remove(record_id) {
    try {
      await api.delete(`/grades-attendance/${record_id}`);
      applyFilter();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="students-page">
      <h2>Grades &amp; Attendance</h2>

      {/* Filter */}
      <form className="form-box" onSubmit={applyFilter}>
        <h3>Filter Records</h3>
        <div className="form-grid">
          <FormField
            label="Enrolment ID"
            type="number"
            value={filterEnrolmentId}
            onChange={setFilterEnrolmentId}
            placeholder="e.g. 1"
          />
          <FormField
            label="Session ID"
            type="number"
            value={filterSessionId}
            onChange={setFilterSessionId}
            placeholder="e.g. 10"
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
        <h3>Create Grade / Attendance Record</h3>
        <div className="form-grid">
          <FormField
            label="Enrolment ID"
            type="number"
            value={enrolment_id}
            onChange={setEnrolmentId}
            required
          />
          <FormField
            label="Session ID"
            type="number"
            value={session_id}
            onChange={setSessionId}
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
              onChange={e => setAttendanceStatus(e.target.value)}
            >
              {ATTENDANCE_OPTIONS.map(opt => (
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

      {/* Table */}
      <table className="students-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Record ID</th>
            <th>Enrolment ID</th>
            <th>Session ID</th>
            <th>Assessment Type</th>
            <th>Score</th>
            <th>Weight</th>
            <th>Attendance Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.record_id}>
              <td>{r.record_id}</td>
              <td>{r.enrolment_id}</td>
              <td>{r.session_id}</td>
              <td>
                {editingId === r.record_id ? (
                  <input
                    value={eAssessmentType}
                    onChange={e => setEAssessmentType(e.target.value)}
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
                    onChange={e => setEScore(e.target.value)}
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
                    onChange={e => setEWeight(e.target.value)}
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
                    onChange={e => setEAttendanceStatus(e.target.value)}
                  >
                    {ATTENDANCE_OPTIONS.map(opt => (
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
              <td colSpan="8" className="no-data">
                No grade/attendance records
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
