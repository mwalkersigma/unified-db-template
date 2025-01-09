import {accessControlSymbol} from "../utils/constants.js";


export default class PermissionsHelper {

    mergePermission(permissionsOne, permissionsTwo) {
        const result = {}
        let keysOne = Object.keys(permissionsOne);
        let keysTwo = Object.keys(permissionsTwo);
        let allKeys = [...new Set(keysOne.concat(keysTwo))];
        for (let permission of allKeys) {
            let permOne = permissionsOne[permission];
            let permTwo = permissionsTwo[permission];

            if (permOne && permTwo) {
                if (typeof permOne === "object" && typeof permTwo === "object") {
                    result[permission] = this.mergePermission(permOne, permTwo);
                } else {
                    if (permOne === true) {
                        result[permission] = true;
                        continue;
                    }
                    if (permTwo === true) {
                        result[permission] = true;
                        continue;
                    }
                    console.log("Weird", permOne, permTwo);
                }
            } else if (permOne || permTwo) {
                result[permission] = permOne || permTwo;
            }
        }
        return result;

    }

    mergePermissions(permissions) {
        // merge serialized permissions
        let results = {};
        for (let permission of permissions) {
            results = this.mergePermission(results, permission);
        }
        return results;
    }
    // Takes Permission strings and serializes them into an object
    serializePermissions(permissions) {
        let serializedPermissions = {};
        for (let permission of permissions) {
            let permissionLevels = permission.split("::");
            let currentLevel = serializedPermissions;
            for (let i = 0; i < permissionLevels.length; i++) {
                let level = permissionLevels[i];
                if (i === permissionLevels.length - 1) {
                    currentLevel[level] = true;
                    break;
                }
                if (!currentLevel[level]) {
                    currentLevel[level] = {};
                }
                currentLevel = currentLevel[level];
            }
        }
        return serializedPermissions;
    }
    // Takes serialized permissions and deserializes them into an array of permission strings
    deserializePermissions(incomingPermissions, parentPermissionString = "") {
        let permissions = [];
        let isArray = Array.isArray(incomingPermissions);
        if (isArray) {
            for (let permission of incomingPermissions) {
                permissions.push(`${parentPermissionString}::${permission}`)
            }
            return permissions.flat();
        }
        let isBoolean = typeof incomingPermissions === "boolean";
        if (isBoolean) return parentPermissionString;
        let isObject = typeof incomingPermissions === "object";
        if (!isObject) {
            return incomingPermissions;
        }
        if (isObject) {
            let keys = Object.keys(incomingPermissions);
            for (let i = 0; i < keys.length; i++) {
                let key = keys[i];
                let value = incomingPermissions[key];
                let newParentPermissionString = parentPermissionString ? `${parentPermissionString}::${key}` : key;
                permissions.push(this.deserializePermissions(value, `${newParentPermissionString}`));

            }
            return permissions.flat();
        }
    }

    canAccess(user, permissionString) {
        let userPrivileges = user[accessControlSymbol];
        let mappedPrivileges = userPrivileges?.map(p=>p?.toLowerCase());
        console.log(userPrivileges);
        let canAccess = mappedPrivileges?.includes(permissionString.toLowerCase());
        if (canAccess) return canAccess;

        let privilegeNeeded = permissionString.split("::")
        console.log(privilegeNeeded);
        let currentLevel = "";
        for (let level of privilegeNeeded) {
            currentLevel += level?.toLowerCase();
            console.log(currentLevel);
            if (mappedPrivileges.includes(currentLevel)) {
                canAccess = true;
                console.log("Break")
                break;
            }
            currentLevel += "::";
        }
        return canAccess;
    }

    selfCanAccess(user, permissionString) {
        let userPrivileges = user[accessControlSymbol];
        let canAccess = userPrivileges.includes(permissionString);
        if (canAccess) return canAccess;

        let privilegeNeeded = permissionString.split("::")
        let currentLevel = "";
        for (let level of privilegeNeeded) {
            currentLevel += level;
            if (userPrivileges.includes(currentLevel + "::self")) {
                canAccess = true;
            }
            currentLevel += "::";
        }
    }

    accessControl(user, permissionString) {
        return this.canAccess(user, permissionString) || this.selfCanAccess(user, permissionString);
    }
}