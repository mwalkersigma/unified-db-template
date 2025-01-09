import router from "../../../../../modules/serverUtils/router.js";
import db from "../../../../../modules/db/index.js";
import {SYSTEM_NAME} from "../../../../../modules/utils/constants.js";


async function getAccess(req, res) {
    const user_id = req?.query?.user_id?.[0];
    if (!user_id) {
        return res.status(400).json({message: "User ID is required"})
    }
    let data = await db.query(`
        SELECT role_name,
               base_permissions,
               permissions,
               permission_level
        FROM users u
                 LEFT JOIN
             access_control.${SYSTEM_NAME} ac ON u.id = ac.user_id
                 LEFT JOIN
             access_control_roles.${SYSTEM_NAME} acr ON acr.role_name = ANY (ac.roles)
        WHERE u.id = $1;
    `, [user_id])
        .then(data => data.rows)
        .then(data => {
            if (data.length === 0) {
                return res.status(404).json({message: "User not found"})
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


export default router({
    GET: getAccess
})