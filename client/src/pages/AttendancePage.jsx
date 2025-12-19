import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

export default function AttendancePage() {
  const [items, setItems] = useState([]);

  // filters (backend supports enrolment_id and/or session_id)
  const [enrolmentFilter, setEnrolmentFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');

  // create form
  const [enrolment_id, setEnrolmentId] = useState('');
  const [session_id, setSessionId] = useState('');
  const [attendance_status, setAttendanceStatus] = useState('Not attended');

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('Not attended');

  async function load() {
    const params = {};
    if (enrolmentFilter) params.enrolment_id = enrolmentFilter;
    if (sessionFilter) params.session_id = sessionFilter;

    const { data } = await api.get('/attendance', { params });
    setItems(data);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [enrolmentFilter, sessionFilter]);

  async function createAttendance(e) {
    e.preventDefault();
    try {
      await api.post('/attendance', {
        enrolment_id: Number(enrolment_id),
        session_id: Number(session_id),
        attendance_status
      });
      setEnrolmentId('');
      setSessionId('');
      setAttendanceStatus('Not attended');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(item) {
    setEditingId(item.attendance_id);
    setEditStatus(item.attendance_status);
  }

  async function saveEdit() {
    try {
      await api.put(`/attendance/${editingId}`, { attendance_status: editStatus });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function setPending(attendance_id) {
    try {
      await api.patch(`/attendance/${attendance_id}/pending`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function verifyAllForSession() {
    try {
      if (!sessionFilter) {
        alert('Set Session ID filter first (session_id) to verify-all.');
        return;
      }
      await api.patch(`/attendance/verify-all/${sessionFilter}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(attendance_id) {
    try {
      await api.delete(`/attendance/${attendance_id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="courses-page">
      <h2>Attendance</h2>

      <div className="search-row">
        <input
          className="search-input"
          value={enrolmentFilter}
          onChange={e => setEnrolmentFilter(e.target.value)}
          placeholder="Filter enrolment_id…"
        />
        <input
          className="search-input"
          value={sessionFilter}
          onChange={e => setSessionFilter(e.target.value)}
          placeholder="Filter session_id…"
        />
        <button onClick={() => { setEnrolmentFilter(''); setSessionFilter(''); }}>
          Clear
        </button>
        <button onClick={verifyAllForSession} title="Verify all Pending in this session (uses session_id filter)">
          Verify-all (session)
        </button>
      </div>

      <form className="create-form" onSubmit={createAttendance}>
        <h3>Create / Upsert Attendance</h3>
        <div className="form-grid">
          <FormField label="Enrolment ID" type="number" value={enrolment_id} onChange={setEnrolmentId} required />
          <FormField label="Session ID" type="number" value={session_id} onChange={setSessionId} required />

          <div className="form-field">
            <label>Attendance Status</label>
            <select value={attendance_status} onChange={e => setAttendanceStatus(e.target.value)}>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Not attended">Not attended</option>
            </select>
          </div>
        </div>

        <div className="form-submit">
          <button type="submit">Save</button>
        </div>
      </form>

      <table className="courses-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Enrolment</th>
            <th>Session</th>
            <th>Status</th>
            <th>Student</th>
            <th>Session Info</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.attendance_id}>
              <td>{it.attendance_id}</td>
              <td>{it.enrolment_id}</td>
              <td>{it.session_id}</td>

              <td>
                {editingId === it.attendance_id ? (
                  <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Not attended">Not attended</option>
                  </select>
                ) : (
                  it.attendance_status
                )}
              </td>

              <td>
                {it.student_name ? (
                  <>
                    <div><b>{it.student_name}</b></div>
                    <div className="muted">{it.student_email || '—'}</div>
                    <div className="muted">student_id: {it.student_id ?? '—'}</div>
                  </>
                ) : '—'}
              </td>

              <td>
                {it.session_no ? (
                  <>
                    <div><b>#{it.session_no}</b> {it.session_title || ''}</div>
                    <div className="muted">{it.room || '—'}</div>
                  </>
                ) : '—'}
              </td>

              <td className="actions-cell">
                {editingId === it.attendance_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(it)}>Edit</button>{' '}
                    <button onClick={() => setPending(it.attendance_id)} title="Force status to Pending">
                      Set Pending
                    </button>{' '}
                    <ConfirmButton confirm="Delete this attendance record?" onClick={() => remove(it.attendance_id)}>
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan="7" className="no-data">No attendance records</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
