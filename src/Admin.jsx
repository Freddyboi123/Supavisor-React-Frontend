import { useState, useEffect } from 'react';
import { fetchEmployeesFromAPI, fetchRolesFromAPI } from './apiReader'; // Assuming you have an API reader function
import { getUserFromToken } from './components/Utils/GetUser';
import EmployeeList from './components/EmployeeList/EmployeeList';
import CreateUserForm from './components/CreateUser/CreateUserForm';
import RoleManager from './components/RoleManager/RoleManager';

export default function Admin() {

  const [ArrayOfEmplyees, setArrayOfEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
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

      <EmployeeList
        employees={ArrayOfEmplyees}
        currentUser={user}
        onEmployeeUpdated={handleEmployeeUpdated}
      />
    </>
  );
}