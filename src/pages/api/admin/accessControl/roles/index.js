import router from "../../../../../modules/serverUtils/router.js";
import db from "../../../../../modules/db/index.js";
import {SYSTEM_NAME} from "../../../../../modules/utils/constants.js";


async function getAccess(req, res) {
    await db.query(`
        SELECT role_name,
               base_permissions,
               role_description
        FROM access_control_roles.${SYSTEM_NAME} acr
    `)
        .then(data => data.rows)
        .then(data => {
            if (data.length === 0) {
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


export default router({
    GET: getAccess
})