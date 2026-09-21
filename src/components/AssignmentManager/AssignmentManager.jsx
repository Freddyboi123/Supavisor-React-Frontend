import { useState } from 'react';
import {
  createAssignmentInAPI,
  updateAssignmentInAPI,
  activateAssignmentInAPI,
  deactivateAssignmentInAPI,
  deleteAssignmentInAPI,
  getErrorMessage,
} from '../../apiReader';
import AssignmentForm from './AssignmentForm';
import { employeeLabel, formatCost, formatMinutes } from './assignmentFormat';
import './AssignmentManager.css';

function byName(a, b) {
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

function AssignmentItem({
  assignment,
  assignments,
  employees,
  onAssignmentUpdated,
  onAssignmentDeleted,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);

  const employee = employees.find((candidate) => candidate.id === assignment.assignedEmployeeId);
  const details = [
    ['Address', assignment.address],
    ['Estimated time', formatMinutes(assignment.estimatedMinutes)],
    ['Cost', formatCost(assignment.cost)],
    [
      'Employee',
      assignment.assignedEmployeeId == null
        ? null
        : employeeLabel(employee) ?? `Employee #${assignment.assignedEmployeeId}`,
    ],
  ];

  // Runs a request, reporting its error on this row.
  const run = async (request) => {
    setIsBusy(true);
    setError(null);
    try {
      await request();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async (payload) => {
    onAssignmentUpdated(await updateAssignmentInAPI(assignment.id, payload));
    setIsEditing(false);
  };

  const handleToggleActive = () =>
    run(async () => {
      onAssignmentUpdated(
        assignment.isActive
          ? await deactivateAssignmentInAPI(assignment.id)
          : await activateAssignmentInAPI(assignment.id)
      );
    });

  const handleDelete = () => {
    if (!window.confirm(`Delete the assignment "${assignment.name}"? This cannot be undone.`)) return;
    return run(async () => {
      await deleteAssignmentInAPI(assignment.id);
      onAssignmentDeleted(assignment.id);
    });
  };

  if (isEditing) {
    return (
      <li className="assignment-item">
        <AssignmentForm
          assignment={assignment}
          assignments={assignments}
          employees={employees}
          submitLabel="Save"
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className={`assignment-item${assignment.isActive ? '' : ' assignment-inactive'}`}>
      <div className="assignment-details">
        <div className="assignment-title">
          <span className="assignment-name">{assignment.name}</span>
          <span className="assignment-status">{assignment.isActive ? 'Active' : 'Inactive'}</span>
        </div>
        <dl>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value ?? '-'}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="assignment-actions">
        <button type="button" onClick={() => setIsEditing(true)} disabled={isBusy}>
          Edit
        </button>
        <button type="button" onClick={handleToggleActive} disabled={isBusy}>
          {assignment.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button type="button" className="assignment-delete" onClick={handleDelete} disabled={isBusy}>
          Delete
        </button>
      </div>
      {error && <p className="assignment-error">{error}</p>}
    </li>
  );
}

// Lists the company's assignments (templates for recurring work) and lets an administrator create them
// with an address, estimated time, cost and employee, then edit, deactivate/activate or delete them.
// Deactivated ones stay listed so they can be activated again.
export default function AssignmentManager({
  assignments,
  employees,
  onAssignmentCreated,
  onAssignmentUpdated,
  onAssignmentDeleted,
}) {
  return (
    <div className="assignment-manager">
      <h2>Assignments</h2>
      <div className="assignment-create">
        <AssignmentForm
          assignments={assignments}
          employees={employees}
          submitLabel="Add assignment"
          resetOnSuccess
          onSubmit={async (payload) => onAssignmentCreated(await createAssignmentInAPI(payload))}
        />
      </div>

      {assignments.length === 0 ? (
        <p className="assignment-hint">No assignments yet.</p>
      ) : (
        <ul>
          {[...assignments].sort(byName).map((assignment) => (
            <AssignmentItem
              key={assignment.id}
              assignment={assignment}
              assignments={assignments}
              employees={employees}
              onAssignmentUpdated={onAssignmentUpdated}
              onAssignmentDeleted={onAssignmentDeleted}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
