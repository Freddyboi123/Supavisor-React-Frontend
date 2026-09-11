

export default function Login() {

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form className="login-form">
                <input
                name = "email"
                type = "email"
                //value = {credentials.email}
                //onChange={handleInputChange}
                placeholder="Email"
                 />
                <input
                name = "password"
                type = "password"
                //value = {credentials.password}
                //onChange={handleInputChange}
                placeholder="Password"
                 />
                <button type="submit">Login</button>

            </form>
        </div>
    );
}