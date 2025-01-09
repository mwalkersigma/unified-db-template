import User, {Visit} from "../classes/user"
import Query from "../classes/Query.js";
import db from "../../modules/db/index.js";
import {SYSTEM_NAME} from "../utils/constants.js";
import { debug } from "../logger/index.js";



async function getUsage() {
    // Log usage to database
    const query = await new Query(
        'users',
        [
            'id',
            "first_name || ' ' || last_name AS name",
            "photo_url AS image",
            'email',
            `
            JSON_AGG(JSON_BUILD_OBJECT(
                'usage_id', usage_id,
                'session_id', session_id,
                'start_time', start_time,
                'close_time', close_time,
                'visit_ended', visit_ended,
                'session_open', session_open,
                'status', status,
                'reason', reason,
                'page', page,
                'page_key', page_key,
                'parent_page_key', parent_page_key,
                'time_away', time_away,
                'duration', duration
            )) AS _visits
            `,
        ]
    )
        .join(`dev.usage.${SYSTEM_NAME} u`, 'LEFT', 'u.user_id = users.id')
        .addGroupBy('name')
        .addGroupBy('image')
        .addGroupBy('email')
        .addGroupBy('id')
        .addWhere('"group"', '!=', 'room')
        .run(db)
        .then(data => data.rows);


    return query
        .map(user => {
            user._visits = user._visits.filter(Boolean).filter(v => v.usage_id);
            user.useCount = user._visits.length;
            return new User(user);
        })
        .reduce((acc, user) => {
            acc[user.email] = user;
            return acc;
        }, {});

}
// stringify interval
function stringifyInterval(interval) {
    if (!interval) return null;
    let results =  Object.entries(interval).reduce((acc, [key, value]) => {
        if (value) {
            acc += `${value} ${key} `;
        }
        return acc;
    },"")
    if(results === "") return null;
    return results;
}

async function addVisit(system, user, visit) {
    debug("Adding Visit", visit);
    return await db.query(`
        INSERT INTO usage.${SYSTEM_NAME}
        (session_id, user_id, status, reason, page, page_key, parent_page_key) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
        visit.sessionID,
        user.id,
        visit.status,
        visit.reason,
        visit.page,
        visit.key,
        visit.parentKey
    ])
}
async function updateVisit(system, user, visit, lastVisit) {
    debug("Updating Visit", visit);
    return await db.query(`
        UPDATE 
            usage.${SYSTEM_NAME}
        SET
            status = $2,
            reason = $3
        WHERE
            usage_id = $1
    `,[lastVisit.usage_id, visit.status, visit.reason])
}
async function closeVisit(system, user, visit, lastVisit){
    debug("Closing Visit", visit);
    return await db.query(`
        UPDATE 
            usage.${SYSTEM_NAME}
        SET
            close_time = $2,
            visit_ended = true,
            status = $3,
            reason = $4,
            time_away = $5
        WHERE
            usage_id = $1
    `, [
        lastVisit.usage_id,
        visit?.closeTime ?? new Date(),
        visit.status,
        visit.reason,
        stringifyInterval(visit.timeAway)
    ])
}
async function closeVisitAndAddNewVisit(system, user, visit, lastVisit){
    const closeResponse = await closeVisit(system, user, visit, lastVisit)
    const addResponse = await addVisit(system, user, {
        sessionID: visit.sessionID,
        user: user,
        status: "User Active",
        reason: "Page Visited",
        page: visit.page,
        key: visit.key,
        parentKey: visit.parentKey,
    })
    return {closeResponse, addResponse}
}
async function closeSession(system, user, visit,lastVisit){
    debug("Closing Session");
    let closeResponse = await closeVisit(system, user, visit, lastVisit)
    return await db.query(`
        UPDATE usage.${SYSTEM_NAME}
        SET
            visit_ended = true,
            session_open = false,
            status = 'User Inactive'
        WHERE
            session_id = $1
    `,[
        visit.sessionID
    ])
}

export default async function logUsage(visit) {
    let system = SYSTEM_NAME;
    const user = visit?.user ?? false;
    if(!user)return "No User";
    const email = visit?.user?.email ?? false;
    if(!email)return "No Email";
    const usage = await getUsage(system);
    let currentUser = usage[email] ? new User(usage[email]) : new User(user);
    let sessionID = visit?.sessionID;
    let [lastVisit] = currentUser.lastOpenVisitFromSession(sessionID);
    const outcomes = {
        "startSession": addVisit,
        "startVisit": addVisit,
        "updateVisit": updateVisit,
        "closeVisit": closeVisitAndAddNewVisit,
        "closeSession": closeSession,
        "doNothing": () => {}
    };
    const hasLastVisit = !!lastVisit;
    const visitEnded = lastVisit?.page !== visit.page;
    const sessionOpen = visit.sessionOpen;

    let outcome;
    switch (true) {
        case !hasLastVisit:
            outcome = "startSession";
            break;
        case visitEnded && sessionOpen:
            outcome = "closeVisit";
            break;
        case !sessionOpen:
            outcome = "closeSession";
            break;
        default:
            outcome = 'updateVisit';
            break;
    }
    if ( process.env.TELEMETRY_ENABLED === 'false') {
        debug("Telemetry is disabled");
        return "Telemetry Disabled"
    }else{
        debug("Telemetry is enabled");
    }
    await outcomes[outcome](
        system,
        currentUser,
        visit,
        lastVisit
    )
    return "Logged"
}