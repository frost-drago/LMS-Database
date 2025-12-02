import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './StudentsPage.css';

export default function StudentsPage() {
  const [rows, setRows] = useState([]);

  // create (new person + student)
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [student_id, setStudentId] = useState('');
  const [cohort, setCohort] = useState('');

  // create (from existing person)
  const [fp_person_id, setFpPersonId] = useState('');
  const [fp_student_id, setFpStudentId] = useState('');
  const [fp_cohort, setFpCohort] = useState('');

  // edit
  const [editingId, setEditingId] = useState(null);
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
      setFullName('');
      setEmail('');
      setStudentId('');
      setCohort('');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function createStudentFromPerson(e) {
    e.preventDefault();
    try {
      await api.post('/students/from-person', {
        person_id: fp_person_id,
        student_id: fp_student_id,
        cohort: fp_cohort || null,
      });
      setFpPersonId('');
      setFpStudentId('');
      setFpCohort('');
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
    <div className="students-page">
      <h2>Students</h2>

      {/* Form 1 */}
      <form className="form-box" onSubmit={createStudent}>
        <h3>Create Student (new person)</h3>
        <div className="form-grid">
          <FormField label="Full Name" value={full_name} onChange={setFullName} required />
          <FormField label="Email" value={email} onChange={setEmail} required />
          <FormField label="Student ID" value={student_id} onChange={setStudentId} maxLength={10} required />
          <FormField label="Cohort" value={cohort} onChange={setCohort} placeholder="e.g. U28" />
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      {/* Form 2 */}
      <form className="form-box" onSubmit={createStudentFromPerson}>
        <h3>Create Student from Person (existing)</h3>
        <div className="form-grid">
          <FormField label="Person ID" type="number" value={fp_person_id} onChange={setFpPersonId} required />
          <FormField label="Student ID" value={fp_student_id} onChange={setFpStudentId} maxLength={10} required />
          <FormField label="Cohort" value={fp_cohort} onChange={setFpCohort} placeholder="e.g. U28" />
        </div>
        <div className="form-submit">
          <button type="submit">Create from Person</button>
        </div>
      </form>

      <table className="students-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Student ID</th><th>Name</th><th>Email</th><th>Cohort</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.student_id}>
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
                  ? <input className="cohort-input" value={eCohort} onChange={e => setECohort(e.target.value)} />
                  : (r.cohort || '—')}
              </td>
              <td className="actions-cell">
                {editingId === r.student_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)}>Edit</button>{' '}
                    <ConfirmButton
                      confirm="Delete this student (and underlying person)?"
                      onClick={() => remove(r.student_id)}
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
              <td colSpan="5" className="no-data">
                No students
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
