import React from "react";
import {usePermissions} from "../../modules/hooks/usePermissions.js";

function Loading({ invisible = false }) {
    if (invisible) return null;
    return <div>Loading...</div>
}

function unauthorized({ children, invisible = false }) {
    if (invisible) return null;
    return <div>
        You do not have the correct permissions or roles to view this content.
        if you feel this is an error, please reach out to the BSA department.
    </div>
}


/**
 * This component is a wrapper for components that require permissions to be viewed.
 * @param children
 * @param permissions
 * @param roles
 * @param users
 * @param LoadingComponent
 * @param UnauthorizedComponent
 * @param invisible
 * @param loading
 * @return {*|JSX.Element}
 * @constructor
 */
export default function PermissionWrapper({ loading = false, children, permissions, roles, users, LoadingComponent = Loading, UnauthorizedComponent = unauthorized, invisible = false }) {
    const {isAuthorized, isLoading} = usePermissions({permissions, roles, users});

    if(isLoading || loading) {
        return <LoadingComponent invisible={invisible}/>;
    }
    if (!isAuthorized) {
        return <UnauthorizedComponent invisible={invisible}/>;
    }

    return children;

}