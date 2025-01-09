import router from "../../../modules/serverUtils/router.js";
import {serverPermissionWrapper} from "../../../modules/auth/serverAdminWrapper.js";


// Simple Routes Are just function that accept req, res
function listGreetings(req, res) {
    res.status(200).json({message: "Hello World!"})
}

// Adding Permissions to a route is as simple as wrapping the function
function adminOnly(req, res) {
    res.status(200).json({message: "Hello Admin!"})
}


export default router({
    GET: listGreetings,
    POST: serverPermissionWrapper(adminOnly, {
        // permissions: ['view::admin::dashboard']
        // roles: ['admin']
        // users: ['mwalker@sigmaequipment.com']
    })
})