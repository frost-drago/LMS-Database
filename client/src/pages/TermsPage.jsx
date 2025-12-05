import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

export default function TermsPage() {
  const [rows, setRows] = useState([]);

  // create
  const [start_date, setStartDate] = useState('');
  const [end_date, setEndDate] = useState('');
  const [term_label, setTermLabel] = useState('');

  // edit
  const [editingId, setEditingId] = useState(null); // term_id
  const [eStartDate, setEStartDate] = useState('');
  const [eEndDate, setEEndDate] = useState('');
  const [eTermLabel, setETermLabel] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/terms');
      setRows(data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createTerm(e) {
    e.preventDefault();
    try {
      await api.post('/terms', {
        start_date,
        end_date,
        term_label,
      });
      setStartDate('');
      setEndDate('');
      setTermLabel('');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(row) {
    setEditingId(row.term_id);
    // assuming backend returns DATE as 'YYYY-MM-DD'
    setEStartDate(row.start_date ?? '');
    setEEndDate(row.end_date ?? '');
    setETermLabel(row.term_label ?? '');
  }

  async function saveEdit() {
    try {
      await api.put(`/terms/${editingId}`, {
        start_date: eStartDate,
        end_date: eEndDate,
        term_label: eTermLabel,
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(term_id) {
    try {
      await api.delete(`/terms/${term_id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  return (
    <div className="students-page">
      <h2>Terms</h2>

      {/* Create term */}
      <form className="form-box" onSubmit={createTerm}>
        <h3>Create Term</h3>
        <div className="form-grid">
          <FormField
            label="Start Date"
            type="date"
            value={start_date}
            onChange={setStartDate}
            required
          />
          <FormField
            label="End Date"
            type="date"
            value={end_date}
            onChange={setEndDate}
            required
          />
          <FormField
            label="Term Label"
            value={term_label}
            onChange={setTermLabel}
            placeholder="e.g. Semester 1 2025"
            required
          />
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      <table className="students-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>Term ID</th>
            <th>Term Label</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.term_id}>
              <td>{r.term_id}</td>
              <td>
                {editingId === r.term_id ? (
                  <input
                    value={eTermLabel}
                    onChange={e => setETermLabel(e.target.value)}
                  />
                ) : (
                  r.term_label
                )}
              </td>
              <td>
                {editingId === r.term_id ? (
                  <input
                    type="date"
                    value={eStartDate || ''}
                    onChange={e => setEStartDate(e.target.value)}
                  />
                ) : (
                  r.start_date
                )}
              </td>
              <td>
                {editingId === r.term_id ? (
                  <input
                    type="date"
                    value={eEndDate || ''}
                    onChange={e => setEEndDate(e.target.value)}
                  />
                ) : (
                  r.end_date
                )}
              </td>
              <td className="actions-cell">
                {editingId === r.term_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(r)}>Edit</button>{' '}
                    <ConfirmButton
                      confirm="Delete this term?"
                      onClick={() => remove(r.term_id)}
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
              <td colSpan="5" className="no-data">
                No terms
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
