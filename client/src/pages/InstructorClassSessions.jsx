// src/pages/InstructorClassSessions.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './StudentsPage.css'; // reuse same styling

// Helpers to convert between MySQL DATETIME strings and <input type="datetime-local">
function toInputDateTime(value) {
  if (!value) return '';
  // handle "YYYY-MM-DD HH:MM:SS" or ISO "YYYY-MM-DDTHH:MM:SS"
  const v = value.replace(' ', 'T');
  // datetime-local wants "YYYY-MM-DDTHH:MM"
  return v.slice(0, 16);
}

function fromInputDateTime(value) {
  if (!value) return null;
  // "YYYY-MM-DDTHH:MM" → "YYYY-MM-DD HH:MM:00"
  return value.replace('T', ' ') + ':00';
}

export default function InstructorClassSessions() {
  const { instructor_id, class_offering_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate(); 
  const classOffering = location.state?.classOffering || null;

  const [rows, setRows] = useState([]);

  // search (within this class only)
  const [search, setSearch] = useState('');

  // create
  const [session_no, setSessionNo] = useState('');
  const [session_start_date, setSessionStartDate] = useState('');
  const [session_end_date, setSessionEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');

  // edit
  const [editingId, setEditingId] = useState(null); // session_id
  const [eSessionNo, setESessionNo] = useState('');
  const [eSessionStartDate, setESessionStartDate] = useState('');
  const [eSessionEndDate, setESessionEndDate] = useState('');
  const [eTitle, setETitle] = useState('');
  const [eRoom, setERoom] = useState('');

  async function load(params = {}) {
    try {
      const fullParams = {
        ...params,
        class_offering_id, // always scope to this class offering
      };
      const { data } = await api.get('/class-sessions', { params: fullParams });
      setRows(data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  useEffect(() => {
    if (class_offering_id) {
      load();
    }
  }, [class_offering_id]);

  async function applyFilter(e) {
    if (e) e.preventDefault();
    try {
      const params = {};
      if (search) params.q = search;
      await load(params);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function clearFilter() {
    setSearch('');
    load();
  }

  async function createSession(e) {
    e.preventDefault();
    try {
      await api.post('/class-sessions', {
        class_offering_id, // fixed, from URL
        session_no,
        session_start_date: fromInputDateTime(session_start_date),
        session_end_date: fromInputDateTime(session_end_date),
        title,
        room,
      });

      // clear form
      setSessionNo('');
      setSessionStartDate('');
      setSessionEndDate('');
      setTitle('');
      setRoom('');

      applyFilter(); // reload with current filter/search
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(row) {
    setEditingId(row.session_id);
    setESessionNo(row.session_no ?? '');
    setESessionStartDate(toInputDateTime(row.session_start_date));
    setESessionEndDate(toInputDateTime(row.session_end_date));
    setETitle(row.title ?? '');
    setERoom(row.room ?? '');
  }

  async function saveEdit() {
    try {
      await api.put(`/class-sessions/${editingId}`, {
        class_offering_id, // keep it pinned to this offering
        session_no: eSessionNo,
        session_start_date: fromInputDateTime(eSessionStartDate),
        session_end_date: fromInputDateTime(eSessionEndDate),
        title: eTitle,
        room: eRoom,
      });
      setEditingId(null);
      applyFilter();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(session_id) {
    try {
      await api.delete(`/class-sessions/${session_id}`);
      applyFilter();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // Nicely formatted header using info passed from InstructorTeachingAssignments
  const headerTitle = classOffering
    ? `${classOffering.course_code} – ${classOffering.course_name}`
    : `Class Offering ID ${class_offering_id}`;
  const headerSubtitle = classOffering
    ? `Class ${classOffering.class_group} (${classOffering.class_type}), Term: ${classOffering.term_label}`
    : `Instructor ${instructor_id}`;

  return (
    <div className="students-page">
      <h2>Class Sessions (Instructor View)</h2>
      <p>
        <strong>{headerTitle}</strong>
        <br />
        {headerSubtitle}
      </p>

      {/* Filter / Search inside this class only */}
      <form className="form-box" onSubmit={applyFilter}>
        <h3>Search Sessions in This Class</h3>
        <div className="form-grid">
          <FormField
            label="Search"
            value={search}
            onChange={setSearch}
            placeholder="title, room..."
          />
        </div>
        <div className="form-submit">
          <button type="submit">Apply Filter</button>{' '}
          <button type="button" onClick={clearFilter}>
            Clear
          </button>
        </div>
      </form>

      {/* Create session (for this class only) */}
      <form className="form-box" onSubmit={createSession}>
        <h3>Create Session for This Class</h3>
        <div className="form-grid">
          <FormField
            label="Session No"
            type="number"
            value={session_no}
            onChange={setSessionNo}
            required
          />
          <FormField
            label="Start Date & Time"
            type="datetime-local"
            value={session_start_date}
            onChange={setSessionStartDate}
            required
          />
          <FormField
            label="End Date & Time"
            type="datetime-local"
            value={session_end_date}
            onChange={setSessionEndDate}
            required
          />
          <FormField
            label="Title"
            value={title}
            onChange={setTitle}
            placeholder="e.g. Week 1 – Intro"
          />
          <FormField
            label="Room"
            value={room}
            onChange={setRoom}
            placeholder="e.g. A503"
          />
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      {/* Sessions table */}
      <table className="students-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Session No</th>
            <th>Start</th>
            <th>End</th>
            <th>Title</th>
            <th>Room</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.session_id}>
              <td>{r.session_id}</td>
              <td>
                {editingId === r.session_id ? (
                  <input
                    type="number"
                    value={eSessionNo}
                    onChange={(e) => setESessionNo(e.target.value)}
                    style={{ width: '70px' }}
                  />
                ) : (
                  r.session_no
                )}
              </td>
              <td>
                {editingId === r.session_id ? (
                  <input
                    type="datetime-local"
                    value={eSessionStartDate || ''}
                    onChange={(e) => setESessionStartDate(e.target.value)}
                  />
                ) : (
                  r.session_start_date
                )}
              </td>
              <td>
                {editingId === r.session_id ? (
                  <input
                    type="datetime-local"
                    value={eSessionEndDate || ''}
                    onChange={(e) => setESessionEndDate(e.target.value)}
                  />
                ) : (
                  r.session_end_date
                )}
              </td>
              <td>
                {editingId === r.session_id ? (
                  <input
                    value={eTitle}
                    onChange={(e) => setETitle(e.target.value)}
                  />
                ) : (
                  r.title
                )}
              </td>
              <td>
                {editingId === r.session_id ? (
                  <input
                    value={eRoom}
                    onChange={(e) => setERoom(e.target.value)}
                    style={{ width: '80px' }}
                  />
                ) : (
                  r.room
                )}
              </td>
              <td className="actions-cell">
                {editingId === r.session_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)}>Edit</button>{' '}
                    <button
                      onClick={() =>
                        navigate(
                          `/instructor/${encodeURIComponent(
                            instructor_id
                          )}/class-offerings/${class_offering_id}/sessions/${r.session_id}/attendance`,
                          {
                            state: {
                              classOffering,
                              session: r,
                            },
                          }
                        )
                      }
                    >
                      Edit attendance
                    </button>{' '}
                    <ConfirmButton
                      confirm="Delete this session?"
                      onClick={() => remove(r.session_id)}
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
              <td colSpan="7" className="no-data">
                No sessions for this class.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
