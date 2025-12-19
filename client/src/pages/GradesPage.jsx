import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

export default function GradesPage() {
  const [items, setItems] = useState([]);

  // filters (backend supports enrolment_id, assessment_id, class_offering_id, course_code)
  const [enrolmentFilter, setEnrolmentFilter] = useState('');
  const [assessmentFilter, setAssessmentFilter] = useState('');
  const [classOfferingFilter, setClassOfferingFilter] = useState('');
  const [courseCodeFilter, setCourseCodeFilter] = useState('');

  // create form
  const [enrolment_id, setEnrolmentId] = useState('');
  const [assessment_id, setAssessmentId] = useState('');
  const [score, setScore] = useState(0);

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [editEnrolmentId, setEditEnrolmentId] = useState('');
  const [editAssessmentId, setEditAssessmentId] = useState('');
  const [editScore, setEditScore] = useState(0);

  async function load() {
    const params = {};
    if (enrolmentFilter) params.enrolment_id = enrolmentFilter;
    if (assessmentFilter) params.assessment_id = assessmentFilter;
    if (classOfferingFilter) params.class_offering_id = classOfferingFilter;
    if (courseCodeFilter) params.course_code = courseCodeFilter;

    const { data } = await api.get('/grades', { params });
    setItems(data);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [enrolmentFilter, assessmentFilter, classOfferingFilter, courseCodeFilter]);

  async function createItem(e) {
    e.preventDefault();
    try {
      await api.post('/grades', {
        enrolment_id: Number(enrolment_id),
        assessment_id: assessment_id ? Number(assessment_id) : null,
        score: Number(score)
      });
      setEnrolmentId('');
      setAssessmentId('');
      setScore(0);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(item) {
    setEditingId(item.grade_id);
    setEditEnrolmentId(String(item.enrolment_id ?? ''));
    setEditAssessmentId(item.assessment_id == null ? '' : String(item.assessment_id));
    setEditScore(item.score ?? 0);
  }

  async function saveEdit() {
    try {
      await api.put(`/grades/${editingId}`, {
        enrolment_id: editEnrolmentId ? Number(editEnrolmentId) : null,
        assessment_id: editAssessmentId ? Number(editAssessmentId) : null,
        score: Number(editScore)
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(grade_id) {
    try {
      await api.delete(`/grades/${grade_id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="courses-page">
      <h2>Grades</h2>

      <div className="search-row">
        <input
          className="search-input"
          value={enrolmentFilter}
          onChange={e => setEnrolmentFilter(e.target.value)}
          placeholder="Filter enrolment_id…"
        />
        <input
          className="search-input"
          value={assessmentFilter}
          onChange={e => setAssessmentFilter(e.target.value)}
          placeholder="Filter assessment_id…"
        />
        <input
          className="search-input"
          value={classOfferingFilter}
          onChange={e => setClassOfferingFilter(e.target.value)}
          placeholder="Filter class_offering_id…"
        />
        <input
          className="search-input"
          value={courseCodeFilter}
          onChange={e => setCourseCodeFilter(e.target.value)}
          placeholder="Filter course_code…"
        />
        <button onClick={() => {
          setEnrolmentFilter('');
          setAssessmentFilter('');
          setClassOfferingFilter('');
          setCourseCodeFilter('');
        }}>
          Clear
        </button>
      </div>

      <form className="create-form" onSubmit={createItem}>
        <h3>Create Grade</h3>
        <div className="form-grid">
          <FormField label="Enrolment ID" type="number" value={enrolment_id} onChange={setEnrolmentId} required />
          <FormField label="Assessment ID (optional)" type="number" value={assessment_id} onChange={setAssessmentId} />
          <FormField label="Score (0-100)" type="number" value={score} onChange={v => setScore(v)} min={0} max={100} />
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      <table className="courses-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Enrolment</th>
            <th>Score</th>
            <th>Assessment</th>
            <th>Student</th>
            <th>Enrolment Info</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.grade_id}>
              <td>{it.grade_id}</td>

              <td>
                {editingId === it.grade_id ? (
                  <input type="number" value={editEnrolmentId} onChange={e => setEditEnrolmentId(e.target.value)} />
                ) : it.enrolment_id}
              </td>

              <td>
                {editingId === it.grade_id ? (
                  <input
                    type="number"
                    value={editScore}
                    onChange={e => setEditScore(e.target.value)}
                    min={0}
                    max={100}
                    className="credit-input"
                  />
                ) : it.score}
              </td>

              <td>
                {editingId === it.grade_id ? (
                  <input
                    type="number"
                    value={editAssessmentId}
                    onChange={e => setEditAssessmentId(e.target.value)}
                    placeholder="(null)"
                    className="credit-input"
                  />
                ) : (
                  <>
                    <div>{it.assessment_type || '—'}</div>
                    <div className="muted">
                      assessment_id: {it.assessment_id ?? '—'} | course: {it.course_code ?? '—'} | weight: {it.weight ?? '—'}
                    </div>
                  </>
                )}
              </td>

              <td>
                {it.student_name ? (
                  <>
                    <div><b>{it.student_name}</b></div>
                    <div className="muted">{it.student_email || '—'}</div>
                    <div className="muted">student_id: {it.student_id ?? '—'}</div>
                  </>
                ) : '—'}
              </td>

              <td>
                <div className="muted">class_offering_id: {it.class_offering_id ?? '—'}</div>
                <div className="muted">enrolment_status: {it.enrolment_status ?? '—'}</div>
              </td>

              <td className="actions-cell">
                {editingId === it.grade_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(it)}>Edit</button>{' '}
                    <ConfirmButton confirm="Delete this grade?" onClick={() => remove(it.grade_id)}>
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan="7" className="no-data">No grades</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
