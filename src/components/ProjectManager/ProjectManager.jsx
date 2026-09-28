import { useState } from 'react';
import {
  createProjectInAPI,
  updateProjectInAPI,
  deleteProjectInAPI,
  fetchProjectStatusHistoryFromAPI,
  getErrorMessage,
} from '../../apiReader';
import './ProjectManager.css';

// Mirrors the backend limits.
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const PROJECT_STATUSES = [
  ['DRAFT', 'Draft'],
  ['ONHOLD', 'On hold'],
  ['COMPLETED', 'Completed'],
  ['ARCHIVED', 'Archived'],
];

function byName(a, b) {
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
}

function statusLabel(status) {
  if (!status) return null;
  return PROJECT_STATUSES.find(([value]) => value === status)?.[1] ?? status;
}

function formatDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatAuditUser(value) {
  return value || null;
}

function toDraft(project) {
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    status: project?.status ?? 'DRAFT',
    assignmentIds: (project?.assignmentIds ?? []).map(String),
  };
}

// Turns the draft into the API payload, or returns { error } for the first thing the backend would reject.
// The backend stays the authority (it also sees other people's changes); this just saves a round trip.
function toPayload(draft, projects, ownId) {
  const name = draft.name.trim();
  if (!name) return { error: 'Project name is required' };
  if (name.length > MAX_NAME_LENGTH) {
    return { error: `Project name must be at most ${MAX_NAME_LENGTH} characters` };
  }

  const taken = projects.some(
    (project) => project.id !== ownId && project.name.toLowerCase() === name.toLowerCase()
  );
  if (taken) return { error: 'A project with this name already exists' };

  const description = draft.description.trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return { error: `Project description must be at most ${MAX_DESCRIPTION_LENGTH} characters` };
  }

  return {
    payload: {
      name,
      description: description || null,
      status: draft.status,
      assignmentIds: draft.assignmentIds.map(Number),
    },
  };
}

// The fields of a project, for creating one (no `project`) or editing one.
// onSubmit(payload) may be async; if it throws, the message is shown in the form.
function ProjectForm({
  project = null,
  projects,
  assignments,
  submitLabel,
  resetOnSuccess = false,
  onSubmit,
  onCancel,
}) {
  const [draft, setDraft] = useState(() => toDraft(project));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (evt) => {
    const { name, value } = evt.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const handleAssignmentChange = (evt) => {
    const { value, checked } = evt.target;
    setDraft((prev) => ({
      ...prev,
      assignmentIds: checked
        ? [...prev.assignmentIds, value]
        : prev.assignmentIds.filter((id) => id !== value),
    }));
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    const { payload, error: problem } = toPayload(draft, projects, project?.id ?? null);
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

  // Deactivated assignments cannot be newly added, but linked ones remain available while editing.
  const assignmentOptions = assignments
    .filter(
      (assignment) =>
        assignment.isActive !== false || draft.assignmentIds.includes(String(assignment.id))
    )
    .sort(byName);

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          name="name"
          type="text"
          value={draft.name}
          onChange={handleChange}
          placeholder="e.g. Weekly office cleaning"
          disabled={isSaving}
          required
        />
      </label>
      <label>
        Description
        <textarea
          name="description"
          value={draft.description}
          onChange={handleChange}
          disabled={isSaving}
        />
      </label>
      <label>
        Status
        <select name="status" value={draft.status} onChange={handleChange} disabled={isSaving}>
          {PROJECT_STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="project-assignment-fieldset" disabled={isSaving}>
        <legend>Assignments</legend>
        {assignmentOptions.length === 0 ? (
          <p className="project-hint">No assignments available.</p>
        ) : (
          <div className="project-assignment-options">
            {assignmentOptions.map((assignment) => (
              <label key={assignment.id}>
                <input
                  type="checkbox"
                  value={assignment.id}
                  checked={draft.assignmentIds.includes(String(assignment.id))}
                  onChange={handleAssignmentChange}
                />
                <span>
                  {assignment.name}
                  {assignment.isActive === false ? ' - deactivated' : ''}
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      {error && <p className="project-error">{error}</p>}
      <div className="project-form-actions">
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

function ProjectItem({
  project,
  projects,
  assignments,
  onProjectUpdated,
  onProjectDeleted,
  onActionSuccess,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const assignmentNames = (project.assignmentIds ?? []).map((assignmentId) => {
    const assignment = assignments.find((candidate) => candidate.id === assignmentId);
    return assignment?.name ?? `Assignment #${assignmentId}`;
  });
  const details = [
    ['Description', project.description],
    ['Assignments', assignmentNames.length > 0 ? assignmentNames.join(', ') : null],
    ['Created by', formatAuditUser(project.createdBy)],
    ['Created at', formatDateTime(project.createdAt)],
    ['Last updated by', formatAuditUser(project.updatedBy)],
    ['Last updated at', formatDateTime(project.updatedAt)],
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
    onProjectUpdated(await updateProjectInAPI(project.id, payload));
    setIsEditing(false);
    onActionSuccess('Project updated.');
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete the project "${project.name}"? This cannot be undone.`)) return;
    return run(async () => {
      await deleteProjectInAPI(project.id);
      onProjectDeleted(project.id);
      onActionSuccess('Project deleted.');
    });
  };

  const handleToggleHistory = async () => {
    const nextShowHistory = !showHistory;
    setShowHistory(nextShowHistory);
    if (!nextShowHistory || statusHistory.length > 0) return;

    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      setStatusHistory(await fetchProjectStatusHistoryFromAPI(project.id));
    } catch (err) {
      setHistoryError(getErrorMessage(err));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  if (isEditing) {
    return (
      <li className="project-item">
        <ProjectForm
          project={project}
          projects={projects}
          assignments={assignments}
          submitLabel="Save"
          onSubmit={handleSave}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="project-item">
      <div className="project-details">
        <div className="project-title">
          <span className="project-name">{project.name}</span>
          <span className="project-status">{statusLabel(project.status) ?? 'Draft'}</span>
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
      <div className="project-actions">
        <button type="button" onClick={() => setIsEditing(true)} disabled={isBusy}>
          Edit
        </button>
        <button type="button" onClick={handleToggleHistory} disabled={isBusy || isLoadingHistory}>
          {showHistory ? 'Hide history' : 'Status history'}
        </button>
        <button type="button" className="project-delete" onClick={handleDelete} disabled={isBusy}>
          Delete
        </button>
      </div>
      {error && <p className="project-error">{error}</p>}
      {showHistory && (
        <div className="project-status-history">
          <h3>Status History</h3>
          {isLoadingHistory ? (
            <p className="project-hint">Loading status history...</p>
          ) : historyError ? (
            <p className="project-error">Could not load status history: {historyError}</p>
          ) : statusHistory.length === 0 ? (
            <p className="project-hint">No status changes yet.</p>
          ) : (
            <div className="project-status-history-table-wrap">
              <table className="project-status-history-table">
                <thead>
                  <tr>
                    <th>Changed at</th>
                    <th>Changed by</th>
                    <th>From status</th>
                    <th>To status</th>
                  </tr>
                </thead>
                <tbody>
                  {statusHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDateTime(entry.changedAt) ?? '-'}</td>
                      <td>{entry.changedBy ?? '-'}</td>
                      <td>{statusLabel(entry.fromStatus) ?? '-'}</td>
                      <td>{statusLabel(entry.toStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// Lists the company's projects and lets an administrator create them with a description, status and
// assignments, then edit or delete them.
export default function ProjectManager({
  projects,
  assignments,
  isLoading = false,
  loadError = null,
  onProjectCreated,
  onProjectUpdated,
  onProjectDeleted,
}) {
  const [success, setSuccess] = useState(null);

  const handleCreated = async (payload) => {
    onProjectCreated(await createProjectInAPI(payload));
    setSuccess('Project created.');
  };

  return (
    <div className="project-manager">
      <h2>Projects</h2>
      {success && <p className="project-success">{success}</p>}
      {loadError && <p className="project-error">Could not load projects: {getErrorMessage(loadError)}</p>}
      <div className="project-create">
        <ProjectForm
          projects={projects}
          assignments={assignments}
          submitLabel="Add project"
          resetOnSuccess
          onSubmit={handleCreated}
        />
      </div>

      {isLoading ? (
        <p className="project-hint">Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className="project-hint">No projects yet.</p>
      ) : (
        <ul>
          {[...projects].sort(byName).map((project) => (
            <ProjectItem
              key={project.id}
              project={project}
              projects={projects}
              assignments={assignments}
              onProjectUpdated={onProjectUpdated}
              onProjectDeleted={onProjectDeleted}
              onActionSuccess={setSuccess}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
