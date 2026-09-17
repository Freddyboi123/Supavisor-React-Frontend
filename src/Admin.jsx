import { useState, useEffect } from 'react';
import { fetchEmployeesFromAPI } from './apiReader'; // Assuming you have an API reader function
import { getUserFromToken } from './components/Utils/GetUser';

export default function Admin() {

  const [ArrayOfEmplyees, setArrayOfEmployees] = useState([]);
  const [user, setUser] = useState(null);
  useEffect(() => {
  (async () => {

    const loggedInUser = getUserFromToken();
    setUser(loggedInUser);
    console.log('Logged-in user:', loggedInUser);
    try {
      const response = await fetchEmployeesFromAPI(1);// hardcoded fix later
      setArrayOfEmployees(response);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  })();
}, []);


  return (
    <>
      <h1> you are on admin page</h1>

      <div className="employee-list">
        <h2>Employee List</h2>
        <ul>
          {ArrayOfEmplyees.map((employee) => (
            <li 
            key={employee.id}
            className="employee-item"
            >
              <div className="employee-details">
                <h3>
                  email: {employee.email}
                  </h3>
                <h3>
                  telefon: {employee.phoneNumber}
                </h3>
                <h3>
                  role: {employee.roles}
                </h3>
              </div>
          
              </li>

          ))}
        </ul>
      </div>
    </>
  );
}