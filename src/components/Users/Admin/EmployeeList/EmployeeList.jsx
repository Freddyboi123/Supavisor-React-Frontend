import { useState } from 'react';
import { updateEmployeeInAPI, deactivateUserInAPI, changeUserRole, getErrorMessage } from '../../../../apiReader';
import { isCurrentUser } from '../../../Utils/GetUser';
import './EmployeeList.css';

const EDITABLE_FIELDS = [
  { name: 'name', label: 'Name', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'phoneNumber', label: 'Telefon', type: 'tel' },
  { name: 'roles', label: 'Access', type: 'text', readOnly: true },
];

const ACTIVE_FIELD = 'isActive';

function customRolesLabel(employee) {
  const names = (employee.customRoles ?? []).map((role) => role.roleName);
  return names.length > 0 ? names.join(', ') : 'None';
}

function statusLabel(isActive) {
  if (isActive === true) return 'Active';
  if (isActive === false) return 'Inactive';
  return 'Unknown';
}

// Lets an administrator change which of the company's custom roles (Kitchen, Cleaning, ...) an
// employee has. It does not touch the employee's system access (Employee/Administrator).
function RoleEditor({ employee, companyRoles, onSave, onCancel }) {
  const [customRoleIds, setCustomRoleIds] = useState(
    (employee.customRoles ?? []).map((role) => role.id)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleToggleRole = (roleId) => {
    setCustomRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await onSave({ customRoleIds });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSaving(false);
    }
  };

  return (
    <form className="employee-edit-form employee-role-editor" onSubmit={handleSubmit}>
      <h3>Change company roles for {employee.name ?? employee.email}</h3>
      <fieldset className="employee-roles" disabled={isSaving}>
        <legend>Company roles</legend>
        {companyRoles.length === 0 ? (
          <p className="employee-roles-hint">
            Your company has no roles yet. Create some under &quot;Roles&quot;.
          </p>
        ) : (
          companyRoles.map((role) => (
            <label key={role.id} className="employee-role">
              <input
                type="checkbox"
                checked={customRoleIds.includes(role.id)}
                onChange={() => handleToggleRole(role.id)}
              />
              {role.roleName}
            </label>
          ))
        )}
      </fieldset>
      {error && <p className="employee-error">Could not save roles: {error}</p>}
      <div className="employee-actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save roles'}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving}>
          Back
        </button>
      </div>
    </form>
  );
}

function EmployeeItem({ employee, companyRoles, isSelf, onEmployeeUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingRoles, setIsChangingRoles] = useState(false);
  const [draft, setDraft] = useState(employee);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const startEditing = () => {
    setDraft(employee);
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setIsChangingRoles(false);
    setError(null);
  };
  
  const handleSaveRoles = async ({ customRoleIds }) => {
    await changeUserRole(employee.id, customRoleIds);
    onEmployeeUpdated({
      ...employee,
      customRoles: companyRoles.filter((role) => customRoleIds.includes(role.id)),
    });
    setIsChangingRoles(false);
  };

  const handleChange = (evt) => {
    const { name, value } = evt.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (evt) => {
    evt.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await updateEmployeeInAPI(draft);
      onEmployeeUpdated({ ...employee, ...draft });
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const isActive = employee[ACTIVE_FIELD] !== false;

  const handleToggleActive = async () => {
    // the server refuses this too; an administrator must not lock themselves out
    if (isSelf && isActive) return;
    const action = isActive ? 'Deactivate' : 'Activate';
    if (!window.confirm(`${action} ${employee.email}?`)) return;

    setIsSaving(true);
    setError(null);
    try {
      await deactivateUserInAPI(employee.id);
      onEmployeeUpdated({ ...employee, [ACTIVE_FIELD]: !isActive });
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <li className="employee-item">
        <div className="employee-details">
          {EDITABLE_FIELDS.map(({ name, label }) => (
            <h3 key={name}>
              {label}: {employee[name]}
            </h3>
          ))}
          <h3>Company roles: {customRolesLabel(employee)}</h3>
          <h3>Status: {statusLabel(employee[ACTIVE_FIELD])}</h3>
        </div>
        <button type="button" onClick={startEditing}>Edit</button>
      </li>
    );
  }

  if (isChangingRoles) {
    return (
      <li className="employee-item">
        <RoleEditor
          employee={employee}
          companyRoles={companyRoles}
          onSave={handleSaveRoles}
          onCancel={() => setIsChangingRoles(false)}
        />
      </li>
    );
  }

  return (
    <li className="employee-item">
      <form className="employee-edit-form" onSubmit={handleSave}>
        {EDITABLE_FIELDS.map(({ name, label, type, readOnly }) =>
          readOnly ? (
            <div key={name} className="employee-readonly-field">
              {label}: {employee[name]}
            </div>
          ) : (
          <label key={name}>
            {label}
            <input
              name={name}
              type={type}
              value={draft[name] ?? ''}
              onChange={handleChange}
              disabled={isSaving}
            />
          </label>
          )
        )}
        {error && <p className="employee-error">Could not save: {error}</p>}
        <div className="employee-actions">
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={cancelEditing} disabled={isSaving}>
            Cancel
          </button>
          {!isSelf && (
            <button type="button" onClick={() => setIsChangingRoles(true)} disabled={isSaving}>
              Change company roles
            </button>
          )}
          {isSelf && isActive ? (
            <span className="employee-self-note">
              You cannot deactivate your own account or change your own role.
            </span>
          ) : (
            <button
              type="button"
              className={isActive ? 'employee-deactivate' : 'employee-activate'}
              onClick={handleToggleActive}
              disabled={isSaving}
            >
              {isActive ? 'Deactivate employee' : 'Activate employee'}
            </button>
          )}
        </div>
      </form>
    </li>
  );
}

export default function EmployeeList({ employees, roles = [], currentUser, onEmployeeUpdated }) {
  return (
    <div className="employee-list">
      <h2>Employee List</h2>
      <ul>
        {employees.map((employee) => (
          <EmployeeItem
            key={employee.id}
            employee={employee}
            companyRoles={roles}
            isSelf={isCurrentUser(currentUser, employee)}
            onEmployeeUpdated={onEmployeeUpdated}
          />
        ))}
      </ul>
    </div>
  );
}
