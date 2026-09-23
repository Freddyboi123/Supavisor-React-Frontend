import {fetchEmployeeFromTenant} from '../../../../apiReader';
import { useState, useEffect } from 'react';
import { getUserFromToken } from '../../../Utils/GetUser';
import './EmployeeDashboard.css';
import { useNavigate } from 'react-router';

const ROLE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

export default function EmployeeDashboard() {

const [currentUser] = useState(getUserFromToken());
const [AllEmployees, setAllEmployees] = useState([]);
const [employeeByCustomRole, setEmployeeByCustomRole] = useState({});
const navigate = useNavigate();

useEffect(() => {
    (async () => {
        try {
            const response = await fetchEmployeeFromTenant(currentUser?.tenantId);

            setAllEmployees(response);

            const sorted = sortEmployeesByCustomRole(response);
            setEmployeeByCustomRole(sorted);

            console.log('Fetched employees:', response);
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    })();
}, []);



function sortEmployeesByCustomRole(employees) {
    const sortedEmployees = {};

    employees.forEach((employee) => {

        if (!employee.customRoles || employee.customRoles.length === 0) {
            if (!sortedEmployees['No Role']) {
                sortedEmployees['No Role'] = [];
            }

            sortedEmployees['No Role'].push(employee);
            return;
        }

        employee.customRoles.forEach((customRole) => {
            const role = customRole.roleName;

            if (!sortedEmployees[role]) {
                sortedEmployees[role] = [];
            }

            sortedEmployees[role].push(employee);
        });
    });

    console.log('Sorted employees:', sortedEmployees);

    return sortedEmployees;
}



return (<div>
  <h2>Employee Dashboard</h2>

    <button onClick={() => navigate('/admin')}>Back to Admin</button>
  {Object.entries(employeeByCustomRole).map(([role, employees], index) => (
    <div
      key={role}
      className="role-group"
      style={{ '--role-color': ROLE_COLORS[index % ROLE_COLORS.length] }}
    >
      <h3>{role}</h3>
      <div className="role-employees">
        {employees.map((employee) => (
          <div key={employee.id} className="employee-card">
            <div className="employee-name">{employee.name}</div>
            <div className="employee-email">{employee.email}</div>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>)

}
