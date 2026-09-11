import { useState } from 'react';


export default function Login() {

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
            console.log('Login submitted:', credentials);
        } catch (error) {
            console.error('Login failed:', error);
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