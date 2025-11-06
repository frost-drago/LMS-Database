import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';

export default function StudentsPage() {
  const [rows, setRows] = useState([]);

  // create fields
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [student_id, setStudentId] = useState('');
  const [cohort, setCohort] = useState('');

  // edit
  const [editingId, setEditingId] = useState(null); // student_id
  const [eFullName, setEFullName] = useState('');
  const [eEmail, setEEmail] = useState('');
  const [eCohort, setECohort] = useState('');

  async function load() {
    const { data } = await api.get('/students');
    setRows(data);
  }
  useEffect(() => { load(); }, []);

  async function createStudent(e) {
    e.preventDefault();
    try {
      await api.post('/students', { full_name, email, student_id, cohort });
      setFullName(''); setEmail(''); setStudentId(''); setCohort('');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(row) {
    setEditingId(row.student_id);
    setEFullName(row.full_name);
    setEEmail(row.email);
    setECohort(row.cohort ?? '');
  }

  async function saveEdit() {
    try {
      await api.put(`/students/${editingId}`, {
        full_name: eFullName,
        email: eEmail,
        cohort: eCohort
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(student_id) {
    try {
      await api.delete(`/students/${student_id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div>
      <h2>Students</h2>

      <form onSubmit={createStudent} style={{ border: '1px solid #eee', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Create Student</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Full Name" value={full_name} onChange={setFullName} required />
          <FormField label="Email" value={email} onChange={setEmail} required />
          <FormField label="Student ID" value={student_id} onChange={setStudentId} maxLength={10} required />
          <FormField label="Cohort" value={cohort} onChange={setCohort} placeholder="e.g. U28" />
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">Create</button>
        </div>
      </form>

      <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>Student ID</th><th>Name</th><th>Email</th><th>Cohort</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.student_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
              <td>{r.student_id}</td>
              <td>
                {editingId === r.student_id
                  ? <input value={eFullName} onChange={e => setEFullName(e.target.value)} />
                  : r.full_name}
              </td>
              <td>
                {editingId === r.student_id
                  ? <input value={eEmail} onChange={e => setEEmail(e.target.value)} />
                  : r.email}
              </td>
              <td>
                {editingId === r.student_id
                  ? <input value={eCohort} onChange={e => setECohort(e.target.value)} style={{ width: 100 }} />
                  : (r.cohort || '—')}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {editingId === r.student_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)}>Edit</button>{' '}
                    <ConfirmButton confirm="Delete this student (and underlying person)?" onClick={() => remove(r.student_id)}>
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan="5" style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>No students</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
