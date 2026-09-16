import { useState } from 'react';
import {login} from '../../apiReader.js';
import { useNavigate } from "react-router";
export default function Login() {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const handleInputChange = (evt) => {
        const { name, value } = evt.target;
        setCredentials((prevCredentials) => (
            {...prevCredentials,[name]: value}));
    }

    const handleSubmit = async (evt) => {
        evt.preventDefault();
        try {
            await login(credentials.email, credentials.password)
            navigate("/")
            console.log('Login successful');
            console.log('JWT Token:', localStorage.getItem('jwtToken'));
            console.log('User:', localStorage.getItem('user'));
        } catch (error) {
            console.error('Login fejlede:', error);
        }
    }

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form className="login-form" onSubmit={handleSubmit}>
                <input
                name = "email"
                type = "email"
                value = {credentials.email}
                onChange={handleInputChange}
                placeholder="Email"
                 />
                <input
                name = "password"
                type = "password"
                value = {credentials.password}
                onChange={handleInputChange}
                placeholder="Password"
                 />
                <button type="submit">Login</button>

            </form>
        </div>
    );
}