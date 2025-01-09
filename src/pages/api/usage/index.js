import router from "../../../modules/serverUtils/router";
import logUsage from "../../../modules/usageTracking/usageTracking";
import Query from "../../../modules/classes/Query.js";
import db from "../../../modules/db/index.js";
import {SYSTEM_NAME} from "../../../modules/utils/constants.js";
import logger from "../../../modules/logger/index.js";
import {parseBody} from "../../../modules/serverUtils/parseBody.js";



async function getHandler(req,res){
    return await new Query(`usage.${SYSTEM_NAME}`, ['*'])
        .conditional(
            req?.query?.user_id,
            q => q.addWhere('user_id', '=', req.query.user_id),
            q => q
        )
        .run(db)
        .then( data => data.rows)
        .then( rows => res.status(200).json(rows))
        .catch( err => res.status(500).json({message: err.message}))
}

async function postHandler(req,res){
    let body = parseBody(req);
    let message = await logUsage(body);
    return res.status(200).json({message})
}


export default router({
    GET: getHandler,
    POST: postHandler
})