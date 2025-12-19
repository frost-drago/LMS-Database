import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import './Styles.css';

export default function InstructorSessionAttendance() {
  const { instructor_id, session_id } = useParams();

  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');

  async function load() {
    try {
      const { data } = await api.get(
        `/attendance/instructor/${instructor_id}/session/${session_id}`
      );
      setItems(data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  useEffect(() => { load(); }, [instructor_id, session_id]);

  function startEdit(item) {
    setEditingId(item.enrolment_id);
    setEditStatus(item.attendance_status);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditStatus('');
  }

  async function saveEdit(enrolment_id) {
    try {
      await api.post('/attendance', {
        enrolment_id,
        session_id: Number(session_id),
        attendance_status: editStatus
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function verifyAllPending() {
    try {
      await api.post(
        `/attendance/instructor/${instructor_id}/session/${session_id}/verify-pending`
      );
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="page">
      <h2>Session Attendance</h2>

      <button onClick={verifyAllPending}>Verify all pending</button>
      <table className="table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Student</th>
            <th>Attendance</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map(it => (
            <tr key={it.enrolment_id}>
              <td>{it.student_name || it.student_id}</td>

              <td>
                {editingId === it.enrolment_id ? (
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                  >
                    <option value="Not attended">Not attended</option>
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                  </select>
                ) : (
                  it.attendance_status || 'Not attended'
                )}
              </td>

              <td className="actions-cell">
                {editingId === it.enrolment_id ? (
                  <>
                    <button onClick={cancelEdit}>Cancel</button>{' '}
                    <button onClick={() => saveEdit(it.enrolment_id)}>Save</button>
                  </>
                ) : (
                  <button onClick={() => startEdit(it)}>Edit</button>
                )}
              </td>
            </tr>
          ))}

          {!items.length && (
            <tr>
              <td colSpan="3" className="no-data">
                No students found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
