import PermissionsHelper from "../classes/permissionsHelper.js";
import {accessControlSymbol, rolesSymbol} from './constants.js'

export function parseAccessControl(accessControl) {
    const permissionsHelper = new PermissionsHelper();
    let roleLevelPermissions = accessControl.map(ac => permissionsHelper.serializePermissions(ac?.['base_permissions'] ?? []));
    let userLevelPermissions = accessControl.map(ac => permissionsHelper.serializePermissions(ac?.['permissions'] ?? []));
    let mergedPermissions = permissionsHelper.mergePermissions(
        roleLevelPermissions.concat(userLevelPermissions)
    );
    let userPermissions = permissionsHelper.deserializePermissions(mergedPermissions)
    let roles = accessControl.map(ac => ac?.['role_name']);
    return {userPermissions, roles}
}

export function baseProcessPermissions({ user , userRoles, userPermissions}, {roles, permissions, users}) {
    if(!user) return false;

    if (!userPermissions || !userRoles) {
        return false;
    }

    let isAdmin = userRoles.includes("admin");
    if (isAdmin) {
        return true;
    }

    if (permissions && userPermissions) {

        let permissionsHelper = new PermissionsHelper();
        let hasCorrectPermissions;
        if(Array.isArray(permissions)){
            hasCorrectPermissions = permissions.some(permission => permissionsHelper.accessControl(user, permission));
        }else{
            hasCorrectPermissions = permissionsHelper.accessControl(user, permissions);
        }

        if (hasCorrectPermissions){
            return true;
        }

    }
    if (roles && userRoles) {
        let hasCorrectRoles;
        if(!Array.isArray(roles)) {
            hasCorrectRoles = userRoles.some(role => roles.includes(role));
        }else{
            hasCorrectRoles = roles.some(role => userRoles.includes(role));
        }
        if (hasCorrectRoles){
            return true;
        }
    }
    if (users) {
        let hasCorrectUsers = users.includes(user.email);
        if (hasCorrectUsers) {
            return true;
        }
    }

    return false;
}

export function processPermissions(user,{ roles, permissions, users}) {
    let userRoles = user?.[rolesSymbol];
    let userPermissions = user?.[accessControlSymbol];
    if (!userRoles || !userPermissions) {
        return false;
    }
    return baseProcessPermissions(
        { user, userRoles, userPermissions},
        {roles, permissions, users}
    )
}

export function processServerPermissions(user, {roles, permissions, users}) {
    let userRoles = user.roles;
    let userPermissions = user.permissions;
    return baseProcessPermissions(
        { user, userRoles, userPermissions},
        {roles, permissions, users}
    )
}