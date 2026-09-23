import { useState, useEffect } from 'react';
import { fetchEmployeeFromTenant, fetchRolesFromAPI, fetchAssignmentsFromAPI } from '../../../apiReader'; // Assuming you have an API reader function
import { getUserFromToken } from '../../Utils/GetUser';
import EmployeeList from './RoleManager/EmployeeList/EmployeeList';
import CreateUserForm from './CreateUser/CreateUserForm';
import RoleManager from './RoleManager/RoleManager';
import AssignmentManager from '../../AssignmentManager/AssignmentManager';

export default function Admin() {

  const [ArrayOfEmplyees, setArrayOfEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [user, setUser] = useState(null);
  useEffect(() => {
  (async () => {

    const loggedInUser = getUserFromToken();
    setUser(loggedInUser);
    console.log('Logged-in user:', loggedInUser);
    try {
      const tennentID = loggedInUser?.tenantId;
      const response = await fetchEmployeeFromTenant(tennentID);
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

      <EmployeeList
        employees={ArrayOfEmplyees}
        currentUser={user}
        onEmployeeUpdated={handleEmployeeUpdated}
      />
    </>
  );
}