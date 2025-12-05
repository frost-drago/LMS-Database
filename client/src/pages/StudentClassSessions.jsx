// src/pages/StudentClassSessions.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import './Styles.css';

export default function StudentClassSessions() {
  const { student_id, class_offering_id } = useParams();
  const location = useLocation();
  const classOffering = location.state?.classOffering || null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await fetch(
          `http://localhost:4000/api/class-sessions/by-student/${encodeURIComponent(
            student_id
          )}/${encodeURIComponent(class_offering_id)}`
        );

        if (!res.ok) {
          setError('Failed to load sessions.');
          setLoading(false);
          return;
        }

        const data = await res.json();
        setRows(data);
      } catch (err) {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    }

    loadSessions();
  }, [student_id, class_offering_id]);

  const handleSetPending = async (record_id) => {
    if (!record_id) return; // nothing to update yet

    try {
      setSavingId(record_id);
      const res = await fetch(
        `http://localhost:4000/api/grades-attendance/${record_id}/attendance-pending`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        console.error('Failed to update attendance');
        return;
      }

      const updated = await res.json();

      setRows((prev) =>
        prev.map((row) =>
          row.record_id === record_id
            ? { ...row, attendance_status: updated.attendance_status }
            : row
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const titleText = classOffering
    ? `${classOffering.course_code} — ${classOffering.course_name}`
    : `Class Offering #${class_offering_id}`;

  return (
    <div className="container-centered">
      <h1 className="title">Class Sessions</h1>
      <p className="subtitle">{titleText}</p>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="placeholder-text">No sessions found for this class.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Session No</th>
                <th>Date</th>
                <th>Title</th>
                <th>Room</th>
                <th>Assessment Type</th>
                <th>Score</th>
                <th>Weight</th>
                <th>Attendance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const date =
                  row.session_start_date &&
                  new Date(row.session_start_date).toLocaleDateString();

                return (
                  <tr key={row.session_id}>
                    <td>{row.session_no}</td>
                    <td>{date || '-'}</td>
                    <td>{row.title || '-'}</td>
                    <td>{row.room || '-'}</td>
                    <td>{row.assessment_type || '-'}</td>
                    <td>{row.score ?? '-'}</td>
                    <td>{row.weight ?? '-'}</td>
                    <td>{row.attendance_status || '-'}</td>
                    <td>
                      <button
                        type="button"
                        className="nav-link"
                        disabled={!row.record_id || savingId === row.record_id}
                        onClick={() => handleSetPending(row.record_id)}
                      >
                        {savingId === row.record_id
                          ? 'Saving...'
                          : 'Set Pending'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
