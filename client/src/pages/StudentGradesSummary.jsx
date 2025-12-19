import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import './Styles.css';

export default function StudentGradesSummary() {
  const { student_id } = useParams();
  const nav = useNavigate();
  const [items, setItems] = useState([]);

  async function load() {
    try {
      const { data } = await api.get(`/grades/student/${student_id}/summary`);
      setItems(data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  useEffect(() => { load(); }, [student_id]);

  return (
    <div className="page">
      <h2>My Grades</h2>

      <table className="table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Term</th>
            <th>Course</th>
            <th>Name</th>
            <th>Total (Weighted)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.class_offering_id}>
              <td>{it.term_name || it.term_id}</td>
              <td>{it.course_code}</td>
              <td>{it.course_name}</td>
              <td>{it.total_weighted}</td>
              <td className="actions-cell">
                <button onClick={() => nav(`/student/${student_id}/grades/${it.class_offering_id}`)}>
                  View
                </button>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr><td colSpan="5" className="no-data">No classes found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
