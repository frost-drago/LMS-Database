import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './CoursesPage.css';

export default function CoursesPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');

  // create form
  const [course_code, setCourseCode] = useState('');
  const [course_name, setCourseName] = useState('');
  const [credit, setCredit] = useState(3);
  const [course_description, setCourseDesc] = useState('');

  // edit state
  const [editingCode, setEditingCode] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCredit, setEditCredit] = useState(3);
  const [editDesc, setEditDesc] = useState('');

  async function load() {
    const { data } = await api.get('/courses', { params: q ? { q } : {} });
    setItems(data);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);

  async function createCourse(e) {
    e.preventDefault();
    try {
      await api.post('/courses', { course_code, course_name, credit: Number(credit), course_description });
      setCourseCode(''); setCourseName(''); setCourseDesc(''); setCredit(3);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(item) {
    setEditingCode(item.course_code);
    setEditName(item.course_name);
    setEditCredit(item.credit);
    setEditDesc(item.course_description ?? '');
  }

  async function saveEdit() {
    try {
      await api.put(`/courses/${editingCode}`, {
        course_name: editName,
        credit: Number(editCredit),
        course_description: editDesc
      });
      setEditingCode(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(code) {
    try {
      await api.delete(`/courses/${code}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="courses-page">
      <h2>Courses</h2>

      <div className="search-row">
        <input
          className="search-input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search code/name…"
        />
        <button onClick={() => setQ('')}>Clear</button>
      </div>

      <form className="create-form" onSubmit={createCourse}>
        <h3>Create Course</h3>
        <div className="form-grid">
          <FormField label="Course Code" value={course_code} onChange={setCourseCode} maxLength={11} required />
          <FormField label="Course Name" value={course_name} onChange={setCourseName} required />
          <FormField label="Credit" type="number" value={credit} onChange={v => setCredit(v)} min={0} max={30} />
          <FormField label="Description" value={course_description} onChange={setCourseDesc} />
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      <table className="courses-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Code</th><th>Name</th><th>Credit</th><th>Description</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.course_code}>
              <td>{it.course_code}</td>
              <td>
                {editingCode === it.course_code ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} />
                ) : it.course_name}
              </td>
              <td>
                {editingCode === it.course_code ? (
                  <input
                    type="number"
                    value={editCredit}
                    onChange={e => setEditCredit(e.target.value)}
                    className="credit-input"
                  />
                ) : it.credit}
              </td>
              <td>
                {editingCode === it.course_code ? (
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                ) : (it.course_description || '—')}
              </td>
              <td className="actions-cell">
                {editingCode === it.course_code ? (
                  <>
                    <button onClick={() => setEditingCode(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(it)}>Edit</button>{' '}
                    <ConfirmButton confirm="Delete this course?" onClick={() => remove(it.course_code)}>
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan="5" className="no-data">No courses</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
