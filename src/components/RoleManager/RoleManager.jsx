import { useState } from 'react';
import { createRoleInAPI, deleteRoleInAPI, getErrorMessage } from '../../apiReader';
import './RoleManager.css';

// Lists the company's own roles (kitchen, cleaning ...) and lets an administrator add or remove them.
export default function RoleManager({ roles, onRoleCreated, onRoleDeleted }) {
  const [roleName, setRoleName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setError(null);

    const name = roleName.trim();
    if (!name) {
      setError('Role name is required');
      return;
    }
    if (roles.some((role) => role.roleName.toLowerCase() === name.toLowerCase())) {
      setError('A role with this name already exists');
      return;
    }

    setIsSaving(true);
    try {
      const created = await createRoleInAPI(name);
      onRoleCreated(created);
      setRoleName('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete the role "${role.roleName}"? It will be removed from everyone who has it.`)) return;

    setIsSaving(true);
    setError(null);
    try {
      await deleteRoleInAPI(role.id);
      onRoleDeleted(role.id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="role-manager">
      <h2>Roles</h2>
      <form className="role-manager-form" onSubmit={handleSubmit}>
        <label>
          New role
          <input
            type="text"
            value={roleName}
            onChange={(evt) => setRoleName(evt.target.value)}
            placeholder="e.g. Kitchen"
            disabled={isSaving}
          />
        </label>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Add role'}
        </button>
      </form>
      {error && <p className="role-manager-error">{error}</p>}

      {roles.length === 0 ? (
        <p className="role-manager-hint">No roles yet.</p>
      ) : (
        <ul>
          {roles.map((role) => (
            <li key={role.id}>
              <span>{role.roleName}</span>
              <button type="button" onClick={() => handleDelete(role)} disabled={isSaving}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
