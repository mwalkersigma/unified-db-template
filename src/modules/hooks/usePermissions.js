import {useContext, useRef} from "react";
import {AccessControlContext} from "../../pages/_app.jsx";
import {processPermissions} from "../utils/permission_utils.js";


class PermissionResults {
    constructor({authorized = false, isLoading = true}) {
        this.isAuthorized = authorized;
        this.isLoading = isLoading;
    }
}


export function usePermissions(options) {
    const authorization = useRef(null);
    const {user} = useContext(AccessControlContext);
    if (!user) {
        return new PermissionResults({
            authorized: false,
            isLoading: true
        });
    }
    if( authorization.current) {

        return authorization.current;
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
    authorization.current = new PermissionResults({
        authorized,
        isLoading: false
    })
    return authorization.current;

}