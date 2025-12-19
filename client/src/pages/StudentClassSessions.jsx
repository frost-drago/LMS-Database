// src/pages/StudentClassSessions.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import './Styles.css';

export default function StudentClassSessions() {
  const { student_id, class_offering_id } = useParams();
  const location = useLocation();
  const classOffering = location.state?.classOffering || null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSessionId, setSavingSessionId] = useState(null);

  async function loadSessions() {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/class-sessions/by-student/${encodeURIComponent(student_id)}/${encodeURIComponent(class_offering_id)}`
      );
      setRows(data);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSessions(); }, [student_id, class_offering_id]);

  async function handleSetPending(session_id_value) {
    try {
      setSavingSessionId(session_id_value);

      const { data } = await api.patch(
        `/attendance/student/${encodeURIComponent(student_id)}/session/${encodeURIComponent(session_id_value)}/pending`
      );

      setRows(prev =>
        prev.map(r =>
          r.session_id === session_id_value
            ? { ...r, attendance_status: data.attendance_status }
            : r
        )
      );
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSavingSessionId(null);
    }
  }

  const titleText = classOffering
    ? `${classOffering.course_code} — ${classOffering.course_name}`
    : `Class Sessions (${class_offering_id})`;

  return (
    <div className="page">
      <h2>{titleText}</h2>

      {loading ? (
        <div className="no-data">Loading…</div>
      ) : (
        <div className="table-wrap">
          <table className="table" width="100%" cellPadding="8">
            <thead>
              <tr>
                <th>No</th>
                <th>Title</th>
                <th>Start</th>
                <th>End</th>
                <th>Room</th>
                <th>Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map(row => {
                const canSetPending = (row.attendance_status === 'Not attended');

                return (
                  <tr key={row.session_id}>
                    <td>{row.session_no}</td>
                    <td>{row.title || '—'}</td>
                    <td>{row.session_start_date}</td>
                    <td>{row.session_end_date}</td>
                    <td>{row.room || '—'}</td>
                    <td>{row.attendance_status || 'Not attended'}</td>
                    <td className="actions-cell">
                      <button
                        disabled={!canSetPending || savingSessionId === row.session_id}
                        onClick={() => handleSetPending(row.session_id)}
                      >
                        {savingSessionId === row.session_id ? 'Saving…' : 'Set Pending'}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {!rows.length && (
                <tr>
                  <td colSpan="7" className="no-data">No sessions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
