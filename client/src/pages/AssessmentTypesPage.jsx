import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

export default function AssessmentTypesPage() {
  const [items, setItems] = useState([]);

  // filters (backend supports course_code and/or assessment_type)
  const [courseCodeFilter, setCourseCodeFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // create form
  const [course_code, setCourseCode] = useState('');
  const [assessment_type, setAssessmentType] = useState('');
  const [weight, setWeight] = useState(10);

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [editCourseCode, setEditCourseCode] = useState('');
  const [editType, setEditType] = useState('');
  const [editWeight, setEditWeight] = useState(10);

  async function load() {
    const params = {};
    if (courseCodeFilter) params.course_code = courseCodeFilter;
    if (typeFilter) params.assessment_type = typeFilter;

    const { data } = await api.get('/assessment-types', { params });
    setItems(data);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [courseCodeFilter, typeFilter]);

  async function createItem(e) {
    e.preventDefault();
    try {
      await api.post('/assessment-types', {
        course_code,
        assessment_type,
        weight: Number(weight)
      });
      setCourseCode('');
      setAssessmentType('');
      setWeight(10);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(item) {
    setEditingId(item.assessment_id);
    setEditCourseCode(item.course_code ?? '');
    setEditType(item.assessment_type ?? '');
    setEditWeight(item.weight ?? 10);
  }

  async function saveEdit() {
    try {
      await api.put(`/assessment-types/${editingId}`, {
        course_code: editCourseCode,
        assessment_type: editType,
        weight: Number(editWeight)
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(assessment_id) {
    try {
      await api.delete(`/assessment-types/${assessment_id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="courses-page">
      <h2>Assessment Types</h2>

      <div className="search-row">
        <input
          className="search-input"
          value={courseCodeFilter}
          onChange={e => setCourseCodeFilter(e.target.value)}
          placeholder="Filter course_code…"
        />
        <input
          className="search-input"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          placeholder="Filter assessment_type…"
        />
        <button onClick={() => { setCourseCodeFilter(''); setTypeFilter(''); }}>
          Clear
        </button>
      </div>

      <form className="create-form" onSubmit={createItem}>
        <h3>Create Assessment Type</h3>
        <div className="form-grid">
          <FormField label="Course Code" value={course_code} onChange={setCourseCode} maxLength={11} required />
          <FormField label="Assessment Type" value={assessment_type} onChange={setAssessmentType} required />
          <FormField label="Weight (0-100)" type="number" value={weight} onChange={v => setWeight(v)} min={0} max={100} />
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      <table className="courses-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Course</th>
            <th>Course Name</th>
            <th>Type</th>
            <th>Weight</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.assessment_id}>
              <td>{it.assessment_id}</td>

              <td>
                {editingId === it.assessment_id ? (
                  <input value={editCourseCode} onChange={e => setEditCourseCode(e.target.value)} />
                ) : (it.course_code || '—')}
              </td>

              <td>{it.course_name || '—'}</td>

              <td>
                {editingId === it.assessment_id ? (
                  <input value={editType} onChange={e => setEditType(e.target.value)} />
                ) : it.assessment_type}
              </td>

              <td>
                {editingId === it.assessment_id ? (
                  <input
                    type="number"
                    value={editWeight}
                    onChange={e => setEditWeight(e.target.value)}
                    className="credit-input"
                    min={0}
                    max={100}
                  />
                ) : it.weight}
              </td>

              <td className="actions-cell">
                {editingId === it.assessment_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(it)}>Edit</button>{' '}
                    <ConfirmButton confirm="Delete this assessment type?" onClick={() => remove(it.assessment_id)}>
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan="6" className="no-data">No assessment types</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
