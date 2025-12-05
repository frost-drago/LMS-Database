import React, { useEffect, useState } from 'react';
import { api, getErrorMessage } from '../api';
import FormField from '../components/FormField';
import ConfirmButton from '../components/ConfirmButton';
import './Styles.css';

export default function PeoplePage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');

  // create form
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  async function load() {
    try {
      const { data } = await api.get('/people'); // backend doesn’t take ?q
      setItems(data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  useEffect(() => {
    load(); // initial load
  }, []);

  async function createPerson(e) {
    e.preventDefault();
    try {
      await api.post('/people', { full_name, email });
      setFullName('');
      setEmail('');
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  function startEdit(item) {
    setEditingId(item.person_id);
    setEditName(item.full_name);
    setEditEmail(item.email ?? '');
  }

  async function saveEdit() {
    try {
      await api.put(`/people/${editingId}`, {
        full_name: editName,
        email: editEmail,
      });
      setEditingId(null);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  async function remove(person_id) {
    try {
      await api.delete(`/people/${person_id}`);
      load();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  }

  // client-side search filter on name/email
  const filteredItems = items.filter(it => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      String(it.full_name || '').toLowerCase().includes(needle) ||
      String(it.email || '').toLowerCase().includes(needle)
    );
  });

  return (
    <div className="people-page">
      <h2>People</h2>

      <div className="search-row">
        <input
          className="search-input"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search name/email…"
        />
        <button onClick={() => setQ('')}>Clear</button>
      </div>

      <form className="create-form" onSubmit={createPerson}>
        <h3>Create Person</h3>
        <div className="form-grid">
          <FormField
            label="Full Name"
            value={full_name}
            onChange={setFullName}
            required
          />
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
        </div>
        <div className="form-submit">
          <button type="submit">Create</button>
        </div>
      </form>

      <table className="people-table" width="100%" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Full name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map(it => (
            <tr key={it.person_id}>
              <td>{it.person_id}</td>
              <td>
                {editingId === it.person_id ? (
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                  />
                ) : (
                  it.full_name
                )}
              </td>
              <td>
                {editingId === it.person_id ? (
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                  />
                ) : (
                  it.email || '—'
                )}
              </td>
              <td className="actions-cell">
                {editingId === it.person_id ? (
                  <>
                    <button onClick={() => setEditingId(null)}>Cancel</button>{' '}
                    <button onClick={saveEdit}>Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(it)}>Edit</button>{' '}
                    <ConfirmButton
                      confirm="Delete this person?"
                      onClick={() => remove(it.person_id)}
                    >
                      Delete
                    </ConfirmButton>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!filteredItems.length && (
            <tr>
              <td colSpan="4" className="no-data">
                No people
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
