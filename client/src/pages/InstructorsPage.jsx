// src/pages/InstructorsPage.jsx
import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './StudentsPage.css'; // reuse same styling

export default function InstructorsPage() {
  const [rows, setRows] = useState([]);

  // create (new person + instructor)
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [instructor_id, setInstructorId] = useState('');

  // create (from existing person)
  const [fp_person_id, setFpPersonId] = useState('');
  const [fp_instructor_id, setFpInstructorId] = useState('');

  // edit
  const [editingId, setEditingId] = useState(null); // instructor_id
  const [eFullName, setEFullName] = useState('');
  const [eEmail, setEEmail] = useState('');

  async function load() {
    const { data } = await api.get('/instructors');
    setRows(data);
  }
  useEffect(() => { load(); }, []);

  // CREATE: new person + instructor (POST /instructors)
  async function createInstructor(e) {
    e.preventDefault();
    try {
      await api.post('/instructors', { full_name, email, instructor_id });
      setFullName('');
      setEmail('');
      setInstructorId('');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // CREATE: from existing person (POST /instructors/from-person)
  async function createInstructorFromPerson(e) {
    e.preventDefault();
    try {
      await api.post('/instructors/from-person', {
        person_id: fp_person_id,
        instructor_id: fp_instructor_id,
      });
      setFpPersonId('');
      setFpInstructorId('');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(row) {
    setEditingId(row.instructor_id);
    setEFullName(row.full_name);
    setEEmail(row.email);
  }

  async function saveEdit() {
    try {
      await api.put(`/instructors/${editingId}`, {
        full_name: eFullName,
        email: eEmail,
        // not changing instructor_id from UI, so no new_instructor_id here
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(instructor_id) {
    try {
      await api.delete(`/instructors/${instructor_id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="students-page">
      <h2>Instructors</h2>

      {/* Form 1: create instructor + person in one shot */}
      <form className="form-box" onSubmit={createInstructor}>
        <h3>Create Instructor (new person)</h3>
        <div className="form-grid">
          <FormField
            label="Full Name"
            value={full_name}
            onChange={setFullName}
            required
          />
          <FormField
            label="Email"
            value={email}
            onChange={setEmail}
            required
          />
          <FormField
            label="Instructor ID"
            value={instructor_id}
            onChange={setInstructorId}
            maxLength={10}
            required
          />
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      {/* Form 2: create instructor from existing person */}
      <form className="form-box" onSubmit={createInstructorFromPerson}>
        <h3>Create Instructor from Person (existing)</h3>
        <div className="form-grid">
          <FormField
            label="Person ID"
            type="number"
            value={fp_person_id}
            onChange={setFpPersonId}
            required
          />
          <FormField
            label="Instructor ID"
            value={fp_instructor_id}
            onChange={setFpInstructorId}
            maxLength={10}
            required
          />
        </div>
        <div className="form-submit">
          <button type="submit">Create from Person</button>
        </div>
      </form>

      <table className="students-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Instructor ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.instructor_id}>
              <td>{r.instructor_id}</td>
              <td>
                {editingId === r.instructor_id ? (
                  <input
                    value={eFullName}
                    onChange={e => setEFullName(e.target.value)}
                  />
                ) : (
                  r.full_name
                )}
              </td>
              <td>
                {editingId === r.instructor_id ? (
                  <input
                    value={eEmail}
                    onChange={e => setEEmail(e.target.value)}
                  />
                ) : (
                  r.email
                )}
              </td>
              <td className="actions-cell">
                {editingId === r.instructor_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)}>Edit</button>{' '}
                    <ConfirmButton
                      confirm="Delete this instructor (and underlying person)?"
                      onClick={() => remove(r.instructor_id)}
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
              <td colSpan="4" className="no-data">
                No instructors
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
