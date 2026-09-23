import {fetchEmployeeFromTenant} from '../../../../apiReader';
import { useState, useEffect } from 'react';

export default function EmployeeDashboard() {

Const [employees, setEmployees] = useState([]);

useEffect(() => {

 (async () => {
    try {
      const response = await fetchEmployeeFromTenant();
      setEmployees(response);
      console.log('Fetched employees:', response);
    } catch (error) {
      console.error('Error fetching employees:', error);
    
    }
    })();
}, [])};
