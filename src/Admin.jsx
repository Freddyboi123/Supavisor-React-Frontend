import { useState, useEffect } from 'react';
import {
  fetchEmployeesFromAPI,
  fetchRolesFromAPI,
  fetchAssignmentsFromAPI,
  fetchProjectsFromAPI,
} from './apiReader'; // Assuming you have an API reader function
import { getUserFromToken } from './components/Utils/GetUser';
import EmployeeList from './components/EmployeeList/EmployeeList';
import CreateUserForm from './components/CreateUser/CreateUserForm';
import RoleManager from './components/RoleManager/RoleManager';
import AssignmentManager from './components/AssignmentManager/AssignmentManager';
import ProjectManager from './components/ProjectManager/ProjectManager';

export default function Admin() {

  const [ArrayOfEmplyees, setArrayOfEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  useEffect(() => {
  (async () => {

    const loggedInUser = getUserFromToken();
    setUser(loggedInUser);
    console.log('Logged-in user:', loggedInUser);
    try {
      const tennentID = loggedInUser?.tenantId;
      const response = await fetchEmployeesFromAPI(tennentID);
      setArrayOfEmployees(response);
      console.log('Fetched employees:', response);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
    try {
      setRoles(await fetchRolesFromAPI(loggedInUser?.tenantId));
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
    try {
      setAssignments(await fetchAssignmentsFromAPI());
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
    try {
      setProjects(await fetchProjectsFromAPI());
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  })();
}, []);


  const handleEmployeeUpdated = (updatedEmployee) => {
    setArrayOfEmployees((prev) =>
      prev.map((employee) =>
        employee.id === updatedEmployee.id ? updatedEmployee : employee
      )
    );
  };

  const handleUserCreated = (createdUser) => {
    setArrayOfEmployees((prev) => [...prev, createdUser]);
  };

  const handleRoleCreated = (createdRole) => {
    setRoles((prev) => [...prev, createdRole]);
  };

  // deleting a role also removes it from every user that had it
  const handleRoleDeleted = (roleId) => {
    setRoles((prev) => prev.filter((role) => role.id !== roleId));
    setArrayOfEmployees((prev) =>
      prev.map((employee) => ({
        ...employee,
        customRoles: (employee.customRoles ?? []).filter((role) => role.id !== roleId),
      }))
    );
  };

  const handleAssignmentCreated = (createdAssignment) => {
    setAssignments((prev) => [...prev, createdAssignment]);
  };

  const handleAssignmentUpdated = (updatedAssignment) => {
    setAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === updatedAssignment.id ? updatedAssignment : assignment
      )
    );
  };

  const handleAssignmentDeleted = (assignmentId) => {
    setAssignments((prev) => prev.filter((assignment) => assignment.id !== assignmentId));
  };

  const handleProjectCreated = (createdProject) => {
    setProjects((prev) => [...prev, createdProject]);
  };

  const handleProjectUpdated = (updatedProject) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  const handleProjectDeleted = (projectId) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
  };

  return (
    <>
      <h1> you are on admin page</h1>

      <CreateUserForm
        employees={ArrayOfEmplyees}
        roles={roles}
        onUserCreated={handleUserCreated}
      />

      <RoleManager
        roles={roles}
        onRoleCreated={handleRoleCreated}
        onRoleDeleted={handleRoleDeleted}
      />

      <AssignmentManager
        assignments={assignments}
        employees={ArrayOfEmplyees}
        onAssignmentCreated={handleAssignmentCreated}
        onAssignmentUpdated={handleAssignmentUpdated}
        onAssignmentDeleted={handleAssignmentDeleted}
      />

      <ProjectManager
        projects={projects}
        assignments={assignments}
        onProjectCreated={handleProjectCreated}
        onProjectUpdated={handleProjectUpdated}
        onProjectDeleted={handleProjectDeleted}
      />

      <EmployeeList
        employees={ArrayOfEmplyees}
        currentUser={user}
        onEmployeeUpdated={handleEmployeeUpdated}
      />
    </>
  );
}
