import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';

export default function ClassOfferingsPage() {
  const [rows, setRows] = useState([]);
  const [term_id, setTermId] = useState('');
  const [course_code, setCourseCode] = useState('');

  // create
  const [cCourse, setCCourse] = useState('');
  const [cTerm, setCTerm] = useState('');
  const [cGroup, setCGroup] = useState('');
  const [cType, setCType] = useState('LEC');

  // edit
  const [editing, setEditing] = useState(null);
  const [eCourse, setECourse] = useState('');
  const [eTerm, setETerm] = useState('');
  const [eGroup, setEGroup] = useState('');
  const [eType, setEType] = useState('LEC');

  async function load() {
    const params = {};
    if (term_id) params.term_id = term_id;
    if (course_code) params.course_code = course_code;
    const { data } = await api.get('/class-offerings', { params });
    setRows(data);
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [term_id, course_code]);

  async function createOffering(e) {
    e.preventDefault();
    try {
      await api.post('/class-offerings', {
        course_code: cCourse,
        term_id: Number(cTerm),
        class_group: cGroup,
        class_type: cType
      });
      setCCourse(''); setCTerm(''); setCGroup(''); setCType('LEC');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(row) {
    setEditing(row.class_offering_id);
    setECourse(row.course_code);
    setETerm(row.term_id);
    setEGroup(row.class_group);
    setEType(row.class_type);
  }

  async function saveEdit() {
    try {
      await api.put(`/class-offerings/${editing}`, {
        course_code: eCourse,
        term_id: Number(eTerm),
        class_group: eGroup,
        class_type: eType
      });
      setEditing(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(id) {
    try {
      await api.delete(`/class-offerings/${id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div>
      <h2>Class Offerings</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '12px 0 20px' }}>
        <FormField label="Filter by Term ID" value={term_id} onChange={setTermId} placeholder="e.g. 1" />
        <FormField label="Filter by Course Code" value={course_code} onChange={setCourseCode} placeholder="It's not working yet" />
      </div>

      <form onSubmit={createOffering} style={{ border: '1px solid #eee', padding: 16, borderRadius: 12, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0 }}>Create Offering</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Course Code" value={cCourse} onChange={setCCourse} required />
          <FormField label="Term ID" value={cTerm} onChange={setCTerm} required />
          <FormField label="Class Group" value={cGroup} onChange={setCGroup} required />
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Class Type</span>
            <select value={cType} onChange={e => setCType(e.target.value)} style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}>
              <option>LEC</option>
              <option>LAB</option>
              <option>TUT</option>
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
            <th>ID</th><th>Course</th><th>Term</th><th>Group</th><th>Type</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.class_offering_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
              <td>{r.class_offering_id}</td>
              <td>{editing === r.class_offering_id ? <input value={eCourse} onChange={e => setECourse(e.target.value)} /> : r.course_code}</td>
              <td>{editing === r.class_offering_id ? <input value={eTerm} onChange={e => setETerm(e.target.value)} style={{ width: 90 }} /> : r.term_id}</td>
              <td>{editing === r.class_offering_id ? <input value={eGroup} onChange={e => setEGroup(e.target.value)} style={{ width: 90 }} /> : r.class_group}</td>
              <td>
                {editing === r.class_offering_id ? (
                  <select value={eType} onChange={e => setEType(e.target.value)}>
                    <option>LEC</option><option>LAB</option><option>TUT</option>
                  </select>
                ) : r.class_type}
              </td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {editing === r.class_offering_id ? (
                  <>
                    <button onClick={() => setEditing(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)}>Edit</button>{' '}
                    <ConfirmButton confirm="Delete this class offering?" onClick={() => remove(r.class_offering_id)}>
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td colSpan="6" style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>No offerings</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
