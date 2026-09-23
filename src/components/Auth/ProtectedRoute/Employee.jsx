import { Outlet } from "react-router";



function  Employee (){
    const [currentUser] = useState(getUserFromToken());

    if (!currentUser || currentUser.isActive === false) {
        alert("Du har ikke adgang til denne side. Kontakt venligst administratoren for at få adgang.");
        return <Navigate to="/auth/login" replace />;
    }

    return (
        <div>
            <Outlet />
        </div>
    )
}
export default Employee;