import db from "../../../../modules/db/index.js";
import router from "../../../../modules/serverUtils/router.js";
import {serverPermissionWrapper} from "../../../../modules/auth/serverAdminWrapper.js";
import {SYSTEM_NAME} from "../../../../modules/utils/constants.js";

async function getAccess(req, res) {
   return  await db.query(`
        SELECT u.id,
               first_name,
               last_name,
               email,
               title,
               manager,
               "group",
               photo_url,
               role_name,
               base_permissions,
               permissions,
               permission_level
        FROM users u
                 LEFT JOIN
             access_control.${SYSTEM_NAME} ac ON u.id = ac.user_id
                 LEFT JOIN
             access_control_roles.${SYSTEM_NAME} acr ON acr.role_name = ANY (ac.roles)
        WHERE u.first_name IS NOT NULL
          AND u.deleted_at IS NULL
          AND u.first_name != ''
          AND u.email IS NOT NULL
          AND u.email != ''
          AND title != 'room'
    `)
        .then(data => data.rows)
        .then(data => {
            if (data.length === 0) {
                console.log("Roles not found")
                return res.status(404).json({message: "Roles not found"})
            }
            res.status(200).json(data)
        })
        .catch(e => {
            console.error(e)
            res.status(500).json({
                message: 'Error',
                error: e.message
            })
        })
}

async function updateAccessControl(req, res, session) {
    const update = {
        id: Number(req.body.id),
        roles: req.body.roles,
        permissions: req.body.permissions
    }

    return await db.query(`
            MERGE INTO 
                access_control.${SYSTEM_NAME}
            USING 
                (SELECT * FROM json_to_record($1) as data(id INT, roles TEXT[], permissions TEXT[])) AS data
            ON 
                access_control.${SYSTEM_NAME}.user_id = data.id
            WHEN MATCHED THEN
                UPDATE SET
                    roles = data.roles,
                    permissions = data.permissions
            WHEN NOT MATCHED THEN
                INSERT (user_id, roles, permissions)
                VALUES (data.id, data.roles, data.permissions)
            returning *
            
        `,
        [JSON.stringify(update)]
    )
        .then(data => data.rows)
        .then(() => {
            res.status(200).json({message: "success"});
        })
        .catch(e => {
            console.error(e)
            res.status(500).json({
                message: 'Error',
                error: e.message
            })
        })

}

export default router({
    GET: getAccess,
    PUT: serverPermissionWrapper(updateAccessControl, {permissions: ['update::accessControl']})
})