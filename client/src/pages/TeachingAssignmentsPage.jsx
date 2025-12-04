import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import ConfirmButton from '../components/ConfirmButton';
import './CoursesPage.css'; // use same styling as CoursesPage

const ROLES = ['Lecturer', 'TA', 'Tutor', 'Grader'];

export default function TeachingAssignmentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters (keep behavior from previous version, just restyled)
  const [filterInstructorId, setFilterInstructorId] = useState('');
  const [filterClassOfferingId, setFilterClassOfferingId] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // dropdown options
  const [instructors, setInstructors] = useState([]);
  const [classOfferings, setClassOfferings] = useState([]);

  // form state
  const [formInstructorId, setFormInstructorId] = useState('');
  const [formClassOfferingId, setFormClassOfferingId] = useState('');
  const [formRole, setFormRole] = useState('Lecturer');

  // composite PK being edited
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadInstructors() {
    try {
      const { data } = await api.get('/instructors');
      setInstructors(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadClassOfferings() {
    try {
      const { data } = await api.get('/class-offerings');
      setClassOfferings(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadAssignments() {
    try {
      setLoading(true);
      const params = {};
      if (filterInstructorId) params.instructor_id = filterInstructorId;
      if (filterClassOfferingId) params.class_offering_id = filterClassOfferingId;
      if (filterRole) params.teaching_role = filterRole;

      const { data } = await api.get('/teaching-assignments', { params });
      setRows(data);
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInstructors();
    loadClassOfferings();
  }, []);

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterInstructorId, filterClassOfferingId, filterRole]);

  function resetForm() {
    setFormInstructorId('');
    setFormClassOfferingId('');
    setFormRole('Lecturer');
    setEditing(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formInstructorId || !formClassOfferingId) {
      alert('Instructor and Class Offering are required');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        // UPDATE: only role changes
        await api.put(
          `/teaching-assignments/${encodeURIComponent(
            editing.instructor_id
          )}/${encodeURIComponent(editing.class_offering_id)}`,
          { teaching_role: formRole }
        );
      } else {
        // CREATE
        await api.post('/teaching-assignments', {
          instructor_id: formInstructorId,
          class_offering_id: Number(formClassOfferingId),
          teaching_role: formRole,
        });
      }
      await loadAssignments();
      resetForm();
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(row) {
    setEditing({
      instructor_id: row.instructor_id,
      class_offering_id: row.class_offering_id,
    });
    setFormInstructorId(row.instructor_id);
    setFormClassOfferingId(row.class_offering_id);
    setFormRole(row.teaching_role || 'Lecturer');
  }

  async function handleDelete(row) {
    try {
      await api.delete(
        `/teaching-assignments/${encodeURIComponent(
          row.instructor_id
        )}/${encodeURIComponent(row.class_offering_id)}`
      );
      await loadAssignments();
      if (
        editing &&
        editing.instructor_id === row.instructor_id &&
        editing.class_offering_id === row.class_offering_id
      ) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      alert(getErrorMessage(err));
    }
  }

  function renderInstructorOptionLabel(inst) {
    const parts = [inst.instructor_id, inst.full_name, inst.email].filter(Boolean);
    return parts.join(' – ');
  }

  function renderClassOfferingOptionLabel(co) {
    const parts = [
      co.class_offering_id,
      co.course_code,
      co.course_name,
      co.term_label,
      co.class_group,
    ].filter(Boolean);
    return parts.join(' – ');
  }

  return (
    <div className="courses-page">
      <h2>Teaching Assignments</h2>

      {/* Filters row, styled like CoursesPage search-row */}
      <div className="search-row">
        <select
          value={filterInstructorId}
          onChange={(e) => setFilterInstructorId(e.target.value)}
          className="search-input"
        >
          <option value="">All instructors</option>
          {instructors.map((inst) => (
            <option key={inst.instructor_id} value={inst.instructor_id}>
              {renderInstructorOptionLabel(inst)}
            </option>
          ))}
        </select>

        <select
          value={filterClassOfferingId}
          onChange={(e) => setFilterClassOfferingId(e.target.value)}
          className="search-input"
        >
          <option value="">All offerings</option>
          {classOfferings.map((co) => (
            <option key={co.class_offering_id} value={co.class_offering_id}>
              {renderClassOfferingOptionLabel(co)}
            </option>
          ))}
        </select>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="search-input"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            setFilterInstructorId('');
            setFilterClassOfferingId('');
            setFilterRole('');
          }}
        >
          Clear
        </button>
      </div>

      {/* Create / Edit form – same structure as CoursesPage */}
      <form className="create-form" onSubmit={handleSubmit}>
        <h3>{editing ? 'Edit Teaching Assignment' : 'Create Teaching Assignment'}</h3>
        <div className="form-grid">
          <label>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Instructor</span>
            <select
              value={formInstructorId}
              onChange={(e) => setFormInstructorId(e.target.value)}
              disabled={!!editing}
            >
              <option value="">Select instructor…</option>
              {instructors.map((inst) => (
                <option key={inst.instructor_id} value={inst.instructor_id}>
                  {renderInstructorOptionLabel(inst)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Class Offering</span>
            <select
              value={formClassOfferingId}
              onChange={(e) => setFormClassOfferingId(e.target.value)}
              disabled={!!editing}
            >
              <option value="">Select offering…</option>
              {classOfferings.map((co) => (
                <option key={co.class_offering_id} value={co.class_offering_id}>
                  {renderClassOfferingOptionLabel(co)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Role</span>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-submit">
          <button type="submit" disabled={saving}>
            {saving
              ? 'Saving...'
              : editing
              ? 'Update Assignment'
              : 'Create Assignment'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table – same table classes as CoursesPage */}
      <table className="courses-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Instructor</th>
            <th>Class Offering</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="4" className="no-data">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan="4" className="no-data">
                No teaching assignments
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={`${r.instructor_id}-${r.class_offering_id}`}>
                <td>
                  <div>{r.instructor_id}</div>
                  {r.instructor_name && (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {r.instructor_name}
                    </div>
                  )}
                </td>
                <td>
                  <div>{r.class_offering_id}</div>
                  {(r.course_code || r.course_name || r.term_label) && (
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {[r.course_code, r.course_name, r.term_label]
                        .filter(Boolean)
                        .join(' – ')}
                    </div>
                  )}
                </td>
                <td>
                  {editing &&
                  editing.instructor_id === r.instructor_id &&
                  editing.class_offering_id === r.class_offering_id ? (
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  ) : (
                    r.teaching_role
                  )}
                </td>
                <td className="actions-cell">
                  {editing &&
                  editing.instructor_id === r.instructor_id &&
                  editing.class_offering_id === r.class_offering_id ? (
                    <>
                      <button type="button" onClick={resetForm}>
                        Cancel
                      </button>{' '}
                      <button type="button" onClick={handleSubmit}>
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                      >
                        Edit
                      </button>{' '}
                      <ConfirmButton
                        confirm="Delete this teaching assignment?"
                        onClick={() => handleDelete(r)}
                      >
                        Delete
                      </ConfirmButton>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
