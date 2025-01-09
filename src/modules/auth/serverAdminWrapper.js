import {auth} from "../../pages/api/auth/[...nextauth]";
import db from "../../modules/db/index.js";
import {parseAccessControl, processServerPermissions} from "../utils/permission_utils.js";
import {SYSTEM_NAME} from "../utils/constants.js";




export function serverPermissionWrapper( cb, options ) {
    const permissions = options?.permissions ?? [];
    const roles = options?.roles ?? [];
    const users = options?.users ?? [];
    const rules = options?.rules ?? [];

    return async (req,res) => {
        const session = await auth(req, res);
        if (!session) {
            return "You must be logged in."
        }
        let email = session['user'].email.toLowerCase();
        const user = await db.query(`
            SELECT 
                * 
            FROM 
                users u
            LEFT JOIN access_control.${SYSTEM_NAME} ac ON u.id = ac.user_id
            LEFT JOIN access_control_roles.${SYSTEM_NAME} acr ON acr.role_name = ANY (ac.roles)
            WHERE 
                u.deleted_at IS NULL
                AND u.email = $1
        `,[email]).then(data => data?.rows);

        if(!user){
            return res.status(401).json({message: "User not found"})
        }
        console.log( user )
        let { roles, userPermissions } = parseAccessControl(user);
        user.roles = roles;
        user.permissions = userPermissions;
        const authorized = processServerPermissions(user, {permissions, roles, users, rules});
        if(!authorized){
            return res.status(401).json({message: "User not authorized"})
        }
        return await cb(req,res,session)

    }



}

