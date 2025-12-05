import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css'; // reuse existing styles

export default function ClassOfferingsPage() {
  const [rows, setRows] = useState([]);

  // single search query (?q=...) like backend
  const [q, setQ] = useState('');

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
    const params = q ? { q } : {};
    const { data } = await api.get('/class-offerings', { params });
    setRows(data);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [q]);

  async function createOffering(e) {
    e.preventDefault();
    try {
      await api.post('/class-offerings', {
        course_code: cCourse,
        term_id: Number(cTerm),
        class_group: cGroup,
        class_type: cType,
      });
      setCCourse('');
      setCTerm('');
      setCGroup('');
      setCType('LEC');
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
        class_type: eType,
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
    <div className="students-page">
      <h2>Class Offerings</h2>

      {/* Search row like CoursesPage */}
      <div className="search-row">
        <input
          className="search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search course code / name…"
        />
        <button type="button" onClick={() => setQ('')}>Clear</button>
      </div>

      {/* Create form */}
      <form onSubmit={createOffering} className="form-box">
        <h3>Create Offering</h3>
        <div className="form-grid">
          <FormField
            label="Course Code"
            value={cCourse}
            onChange={setCCourse}
            required
          />
          <FormField
            label="Term ID"
            value={cTerm}
            onChange={setCTerm}
            required
          />
          <FormField
            label="Class Group"
            value={cGroup}
            onChange={setCGroup}
            required
          />
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Class Type</span>
            <select
              value={cType}
              onChange={(e) => setCType(e.target.value)}
              style={{ padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8 }}
            >
              <option>LEC</option>
              <option>LAB</option>
              <option>TUT</option>
            </select>
          </label>
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      {/* Table */}
      <table className="students-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Course (Code / Name)</th>
            <th>Term</th>
            <th>Group</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.class_offering_id}>
              <td>{r.class_offering_id}</td>
              <td>
                {editing === r.class_offering_id ? (
                  <input
                    value={eCourse}
                    onChange={(e) => setECourse(e.target.value)}
                  />
                ) : (
                  <>
                    <div>{r.course_code}</div>
                    {r.course_name && (
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        {r.course_name}
                      </div>
                    )}
                  </>
                )}
              </td>
              <td>
                {editing === r.class_offering_id ? (
                  <input
                    value={eTerm}
                    onChange={(e) => setETerm(e.target.value)}
                    style={{ width: 90 }}
                  />
                ) : (
                  <>
                    <div>{r.term_id}</div>
                    {r.term_label && (
                      <div style={{ fontSize: 12, opacity: 0.8 }}>
                        {r.term_label}
                      </div>
                    )}
                  </>
                )}
              </td>
              <td>
                {editing === r.class_offering_id ? (
                  <input
                    value={eGroup}
                    onChange={(e) => setEGroup(e.target.value)}
                    style={{ width: 90 }}
                  />
                ) : (
                  r.class_group
                )}
              </td>
              <td>
                {editing === r.class_offering_id ? (
                  <select
                    value={eType}
                    onChange={(e) => setEType(e.target.value)}
                  >
                    <option>LEC</option>
                    <option>LAB</option>
                    <option>TUT</option>
                  </select>
                ) : (
                  r.class_type
                )}
              </td>
              <td className="actions-cell">
                {editing === r.class_offering_id ? (
                  <>
                    <button type="button" onClick={() => setEditing(null)}>
                      Cancel
                    </button>{' '}
                    <button type="button" onClick={saveEdit}>
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => startEdit(r)}>
                      Edit
                    </button>{' '}
                    <ConfirmButton
                      confirm="Delete this class offering?"
                      onClick={() => remove(r.class_offering_id)}
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
              <td colSpan="6" className="no-data">
                No offerings
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
