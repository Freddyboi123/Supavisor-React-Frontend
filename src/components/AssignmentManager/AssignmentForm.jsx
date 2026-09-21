import { useState } from 'react';
import { getErrorMessage } from '../../apiReader';
import { employeeLabel, minutesToHoursText, parseCostText, parseHoursText } from './assignmentFormat';

// Mirrors the backend limits.
const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 255;

function toDraft(assignment) {
  return {
    name: assignment?.name ?? '',
    address: assignment?.address ?? '',
    hours: minutesToHoursText(assignment?.estimatedMinutes),
    cost: assignment?.cost != null ? String(assignment.cost) : '',
    employeeId: assignment?.assignedEmployeeId != null ? String(assignment.assignedEmployeeId) : '',
  };
}

// Turns the draft into the API payload, or returns { error } for the first thing the backend would reject.
// The backend stays the authority (it also sees other people's changes); this just saves a round trip.
function toPayload(draft, assignments, ownId) {
  const name = draft.name.trim();
  if (!name) return { error: 'Assignment name is required' };
  if (name.length > MAX_NAME_LENGTH) return { error: `Assignment name must be at most ${MAX_NAME_LENGTH} characters` };
  const taken = assignments.some(
    (assignment) => assignment.id !== ownId && assignment.name.toLowerCase() === name.toLowerCase()
  );
  if (taken) return { error: 'An assignment with this name already exists' };

  const address = draft.address.trim();
  if (address.length > MAX_ADDRESS_LENGTH) return { error: `Address must be at most ${MAX_ADDRESS_LENGTH} characters` };

  const time = parseHoursText(draft.hours);
  if (time.error) return { error: time.error };
  const cost = parseCostText(draft.cost);
  if (cost.error) return { error: cost.error };

  return {
    payload: {
      name,
      address: address || null,
      estimatedMinutes: time.minutes,
      cost: cost.cost,
      assignedEmployeeId: draft.employeeId ? Number(draft.employeeId) : null,
    },
  };
}

// The fields of an assignment, for creating one (no `assignment`) or editing one.
// onSubmit(payload) may be async; if it throws, the message is shown in the form.
export default function AssignmentForm({
  assignment = null,
  assignments,
  employees,
  submitLabel,
  resetOnSuccess = false,
  onSubmit,
  onCancel,
}) {
  const [draft, setDraft] = useState(() => toDraft(assignment));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (evt) => {
    const { name, value } = evt.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const { payload, error: problem } = toPayload(draft, assignments, assignment?.id ?? null);
    if (problem) {
      setError(problem);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit(payload);
      if (resetOnSuccess) setDraft(toDraft(null));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Deactivated employees cannot be newly assigned, but one who is already linked stays selectable.
  const employeeOptions = employees
    .filter((employee) => employee.isActive !== false || String(employee.id) === draft.employeeId)
    .sort((a, b) => employeeLabel(a).localeCompare(employeeLabel(b)));

  return (
    <form className="assignment-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          name="name"
          type="text"
          value={draft.name}
          onChange={handleChange}
          placeholder="e.g. Cleaning at Main Street 1"
          disabled={isSaving}
          required
        />
      </label>
      <label>
        Address
        <input
          name="address"
          type="text"
          value={draft.address}
          onChange={handleChange}
          disabled={isSaving}
        />
      </label>
      <div className="assignment-form-row">
        <label>
          Estimated time (hours)
          <input
            name="hours"
            type="number"
            min="0"
            step="0.25"
            value={draft.hours}
            onChange={handleChange}
            disabled={isSaving}
          />
        </label>
        <label>
          Cost
          <input
            name="cost"
            type="number"
            min="0"
            step="0.01"
            value={draft.cost}
            onChange={handleChange}
            disabled={isSaving}
          />
        </label>
      </div>
      <label>
        Employee
        <select name="employeeId" value={draft.employeeId} onChange={handleChange} disabled={isSaving}>
          <option value="">Unassigned</option>
          {employeeOptions.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employeeLabel(employee)}
              {employee.isActive === false ? ' - deactivated' : ''}
            </option>
          ))}
        </select>
      </label>
      {error && <p className="assignment-error">{error}</p>}
      <div className="assignment-form-actions">
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isSaving}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
