import { Outlet, Navigate } from "react-router";
import { getUserFromToken } from "../../Utils/GetUser.jsx";
import { useState } from "react";

function  AdminOnly (){
    const [currentUser] = useState(getUserFromToken());

    if (!currentUser || currentUser.roles !== "ADMIN" || currentUser.isActive === false) {
        alert("Du har ikke adgang til denne side. Kontakt venligst administratoren for at få adgang.");
        return <Navigate to="/auth/login" replace />;
    }

    return (
        <div>
            <Outlet />
        </div>
    )
}
export default AdminOnly;