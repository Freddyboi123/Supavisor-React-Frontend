import { useState } from 'react';
import { createUserInAPI, getErrorMessage } from '../../../../apiReader';
import './CreateUserForm.css';

// The system role decides what the user may do in the app.
const SYSTEM_ROLES = [
  { value: 'USER', label: 'Employee' },
  { value: 'ADMIN', label: 'Administrator' },
];

// customRoleIds starts empty: no company role is pre-selected.
const EMPTY_FORM = { name: '', email: '', systemRole: SYSTEM_ROLES[0].value, customRoleIds: [] };

export default function CreateUserForm({ employees, roles, onUserCreated }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  const handleChange = (evt) => {
    const { name, value } = evt.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleRole = (roleId) => {
    setForm((prev) => ({
      ...prev,
      customRoleIds: prev.customRoleIds.includes(roleId)
        ? prev.customRoleIds.filter((id) => id !== roleId)
        : [...prev.customRoleIds, roleId],
    }));
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setError(null);
    setCreated(null);

    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) {
      setError('Name is required');
      return;
    }
    if (employees.some((employee) => employee.email?.toLowerCase() === email.toLowerCase())) {
      setError('A user with this email already exists');
      return;
    }

    setIsSaving(true);
    try {
      const { user, temporaryPassword } = await createUserInAPI({
        name,
        email,
        systemRole: form.systemRole,
        customRoleIds: form.customRoleIds,
      });
      onUserCreated(user);
      setCreated({ email: user.email, temporaryPassword });
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="create-user">
      <h2>Create user</h2>
      <form className="create-user-form" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            disabled={isSaving}
            required
          />
        </label>
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            disabled={isSaving}
            required
          />
        </label>
        <label>
          Access
          <select name="systemRole" value={form.systemRole} onChange={handleChange} disabled={isSaving}>
            {SYSTEM_ROLES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <fieldset className="create-user-roles" disabled={isSaving}>
          <legend>Roles</legend>
          {roles.length === 0 ? (
            <p className="create-user-hint">
              Your company has no roles yet. Create some under &quot;Roles&quot; below.
            </p>
          ) : (
            roles.map((role) => (
              <label key={role.id} className="create-user-role">
                <input
                  type="checkbox"
                  checked={form.customRoleIds.includes(role.id)}
                  onChange={() => handleToggleRole(role.id)}
                />
                {role.roleName}
              </label>
            ))
          )}
        </fieldset>
        {error && <p className="create-user-error">Could not create user: {error}</p>}
        <div>
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create user'}
          </button>
        </div>
      </form>

      {created && (
        <div className="create-user-success" role="status">
          <p>
            Created <strong>{created.email}</strong>. Temporary password:{' '}
            <code>{created.temporaryPassword}</code>
          </p>
          <p>This is only shown once - pass it on to the user and ask them to change it.</p>
          <button type="button" onClick={() => setCreated(null)}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
