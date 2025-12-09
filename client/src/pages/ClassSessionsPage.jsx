import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

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

export default function ClassSessionsPage() {
  const [rows, setRows] = useState([]);

  // filters
  const [search, setSearch] = useState('');

  // create
  const [class_offering_id, setClassOfferingId] = useState('');
  const [session_no, setSessionNo] = useState('');
  const [session_start_date, setSessionStartDate] = useState('');
  const [session_end_date, setSessionEndDate] = useState('');
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');

  // edit
  const [editingId, setEditingId] = useState(null); // session_id
  const [eClassOfferingId, setEClassOfferingId] = useState('');
  const [eSessionNo, setESessionNo] = useState('');
  const [eSessionStartDate, setESessionStartDate] = useState('');
  const [eSessionEndDate, setESessionEndDate] = useState('');
  const [eTitle, setETitle] = useState('');
  const [eRoom, setERoom] = useState('');

  async function load() { 
    try {
      const params = search ? { q: search } : {};
      const { data } = await api.get('/class-sessions', { params });
      setRows(data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }
  
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function createSession(e) {
    e.preventDefault();
    try {
      await api.post('/class-sessions', {
        class_offering_id,
        session_no,
        session_start_date: fromInputDateTime(session_start_date),
        session_end_date: fromInputDateTime(session_end_date),
        title,
        room,
      });
      setClassOfferingId('');
      setSessionNo('');
      setSessionStartDate('');
      setSessionEndDate('');
      setTitle('');
      setRoom('');
      load(); 
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(row) {
    setEditingId(row.session_id);
    setEClassOfferingId(row.class_offering_id ?? '');
    setESessionNo(row.session_no ?? '');
    setESessionStartDate(toInputDateTime(row.session_start_date));
    setESessionEndDate(toInputDateTime(row.session_end_date));
    setETitle(row.title ?? '');
    setERoom(row.room ?? '');
  }

  async function saveEdit() {
    try {
      await api.put(`/class-sessions/${editingId}`, {
        class_offering_id: eClassOfferingId,
        session_no: eSessionNo,
        session_start_date: fromInputDateTime(eSessionStartDate),
        session_end_date: fromInputDateTime(eSessionEndDate),
        title: eTitle,
        room: eRoom,
      });
      setEditingId(null);
      load(); 
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(session_id) {
    try {
      await api.delete(`/class-sessions/${session_id}`);
      load(); 
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="students-page">
      <h2>Class Sessions</h2>

      {/* Filter / Search */}
      <div className="search-row">
        <input
        className="search-input"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search title, room, course code..."
        />
        <button onClick={() => setSearch('')}>Clear</button>
      </div>

      {/* Create session */}
      <form className="form-box" onSubmit={createSession}>
        <h3>Create Class Session</h3>
        <div className="form-grid">
          <FormField
            label="Class Offering ID"
            type="number"
            value={class_offering_id}
            onChange={setClassOfferingId}
            required
          />
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
            placeholder="e.g. Week 1 - Intro"
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

      <table className="students-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Course</th>
            <th>Class</th>
            <th>Term</th>
            <th>Session No</th>
            <th>Start</th>
            <th>End</th>
            <th>Title</th>
            <th>Room</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.session_id}>
              <td>{r.session_id}</td>
              <td>
                {/* course_code + course_name */}
                {r.course_code} – {r.course_name}
              </td>
              <td>
                {/* class_group + class_type */}
                {r.class_group} ({r.class_type})
              </td>
              <td>{r.term_label}</td>
              <td>
                {editingId === r.session_id ? (
                  <input
                    type="number"
                    value={eSessionNo}
                    onChange={e => setESessionNo(e.target.value)}
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
                    onChange={e => setESessionStartDate(e.target.value)}
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
                    onChange={e => setESessionEndDate(e.target.value)}
                  />
                ) : (
                  r.session_end_date
                )}
              </td>
              <td>
                {editingId === r.session_id ? (
                  <input
                    value={eTitle}
                    onChange={e => setETitle(e.target.value)}
                  />
                ) : (
                  r.title
                )}
              </td>
              <td>
                {editingId === r.session_id ? (
                  <input
                    value={eRoom}
                    onChange={e => setERoom(e.target.value)}
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
              <td colSpan="10" className="no-data">
                No class sessions
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
