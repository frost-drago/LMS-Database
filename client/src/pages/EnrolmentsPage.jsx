import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

export default function EnrolmentsPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');

  // create
  const [cOffering, setCOffering] = useState('');
  const [cStudent, setCStudent] = useState('');
  const [cStatus, setCStatus] = useState('Active');

  // edit
  const [editing, setEditing] = useState(null);
  const [eStatus, setEStatus] = useState('Active');

  async function load() {
    const params = {};
    if (search) params.student_id = search; 
    const { data } = await api.get('/enrolments', { params });
    setRows(data);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function createEnrolment(e) {
    e.preventDefault();
    try {
      await api.post('/enrolments', {
        class_offering_id: Number(cOffering),
        student_id: cStudent,
        enrolment_status: cStatus
      });
      setCOffering(''); setCStudent(''); setCStatus('Active');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(row) {
    setEditing(row.enrolment_id);
    setEStatus(row.enrolment_status);
  }

  async function saveEdit() {
    try {
      await api.put(`/enrolments/${editing}`, { enrolment_status: eStatus });
      setEditing(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/enrolments/${id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div>
      <h2>Enrollments</h2>
      <div className="search-row">
        <input
          className="search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by Student ID..."
        />
        <button onClick={() => setSearch('')}>Clear</button>
      </div>

      <form onSubmit={createEnrolment} style={{ border: '1px solid #eee', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Create Enrolment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FormField label="Class Offering ID" value={cOffering} onChange={setCOffering} required />
          <FormField label="Student ID" value={cStudent} onChange={setCStudent} required />
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Status</span>
            <select value={cStatus} onChange={e => setCStatus(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">Create</button>
        </div>
      </form>

      <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>ID</th><th>Offering</th><th>Student</th><th>Name</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.enrolment_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
              <td>{r.enrolment_id}</td>
              <td>{r.class_offering_id} ({r.class_group}/{r.class_type})</td>
              <td>{r.student_id}</td>
              <td>{r.full_name}</td>
              <td>
                {editing === r.enrolment_id ? (
                  <select value={eStatus} onChange={e => setEStatus(e.target.value)}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                ) : r.enrolment_status}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {editing === r.enrolment_id ? (
                  <>
                    <button onClick={() => setEditing(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)}>Edit</button>{' '}
                    <ConfirmButton confirm="Delete this enrolment?" onClick={() => remove(r.enrolment_id)}>
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>No enrolments</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
