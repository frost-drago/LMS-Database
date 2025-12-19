import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import './Styles.css';

export default function StudentGradesDetail() {
  const { student_id, class_offering_id } = useParams();
  const [data, setData] = useState(null);

  async function load() {
    try {
      const res = await api.get(`/grades/student/${student_id}/class-offering/${class_offering_id}`);
      setData(res.data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  useEffect(() => { load(); }, [student_id, class_offering_id]);

  if (!data) return <div className="page"><div className="no-data">Loading…</div></div>;

  return (
    <div className="page">
      <h2>{data.course_code} — {data.course_name}</h2>
      <div className="subtle">Total (Weighted): <b>{data.total_weighted}</b></div>

      <table className="table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Assessment</th>
            <th>Weight</th>
            <th>Score</th>
            <th>Weighted</th>
          </tr>
        </thead>
        <tbody>
          {data.components.map(c => (
            <tr key={c.assessment_id}>
              <td>{c.assessment_type}</td>
              <td>{c.weight}</td>
              <td>{c.score ?? '—'}</td>
              <td>{c.weighted_score ?? '—'}</td>
            </tr>
          ))}
          {!data.components.length && (
            <tr><td colSpan="4" className="no-data">No assessments defined</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
