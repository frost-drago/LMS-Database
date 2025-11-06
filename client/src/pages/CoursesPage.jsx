import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';

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

  useEffect(() => { load(); /* initial */ }, []);
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
    <div>
      <h2>Courses</h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0 20px' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search code/name…"
          style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, flex: 1 }}
        />
        <button onClick={() => setQ('')}>Clear</button>
      </div>

      <form onSubmit={createCourse} style={{ border: '1px solid #eee', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Create Course</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Course Code" value={course_code} onChange={setCourseCode} maxLength={11} required />
          <FormField label="Course Name" value={course_name} onChange={setCourseName} required />
          <FormField label="Credit" type="number" value={credit} onChange={v => setCredit(v)} min={0} max={30} />
          <FormField label="Description" value={course_description} onChange={setCourseDesc} />
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="submit">Create</button>
        </div>
      </form>

      <table width="100%" cellPadding="8" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
            <th>Code</th><th>Name</th><th>Credit</th><th>Description</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.course_code} style={{ borderBottom: '1px solid #f2f2f2' }}>
              <td>{it.course_code}</td>
              <td>
                {editingCode === it.course_code ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)} />
                ) : it.course_name}
              </td>
              <td>
                {editingCode === it.course_code ? (
                  <input type="number" value={editCredit} onChange={e => setEditCredit(e.target.value)} style={{ width: 80 }} />
                ) : it.credit}
              </td>
              <td>
                {editingCode === it.course_code ? (
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                ) : (it.course_description || '—')}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
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
            <tr><td colSpan="5" style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>No courses</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
