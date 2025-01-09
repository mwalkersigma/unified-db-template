import {useContext, useState} from "react";
import {AccessControlContext} from "../../pages/_app.jsx";
import {processPermissions} from "../utils/permission_utils.js";


class PermissionResults {
    constructor({authorized = false, isLoading = true}) {
        this.isAuthorized = authorized;
        this.isLoading = isLoading;
    }
}



export function usePermissions(options) {
    let [isAuthorized, setIsAuthorized] = useState(false);
    const { user } = useContext(AccessControlContext);
    if(!user) {
        return new PermissionResults({
            authorized: false,
            isLoading: true
        });
    }
    if(isAuthorized) {
        // if we are already authorized, we can return early
        return new PermissionResults({
            authorized: true,
            isLoading: false
        });
    }

    let permissions = options?.permissions ?? [];
    let roles = options?.roles ?? [];
    let users = options?.users ?? [];
    let authorized = processPermissions(
        user,
        {
            roles,
            permissions,
            users
        }
    );

    return new PermissionResults({
        authorized,
        isLoading: false
    })

}