import pg from "pg";
import * as dotenv from "dotenv";
import {sep} from "path";

const currentDirectory = process.cwd();
console.log(`Current directory: ${currentDirectory}`)
const path = currentDirectory.split('scripts')[0] + '.env';
console.log(`Path: ${path}`)
let loaded = dotenv.config({
    path: path
});
// console.log(loaded)
// console.log(process.env)
const {Pool} = pg;

const SYSTEM_NAME = process.env.NEXT_PUBLIC_SYSTEM_NAME;
if (!SYSTEM_NAME) {
    throw new Error("NEXT_PUBLIC_SYSTEM_NAME is required. Received: " + SYSTEM_NAME);
}
if (SYSTEM_NAME === 'SystemNameHere') {
    throw new Error("NEXT_PUBLIC_SYSTEM_NAME is not set");
}
const baseConnectionString = process.env.CONNECTION_STRING
if (!baseConnectionString) {
    throw new Error("CONNECTION_STRING is required");
}
if (baseConnectionString === 'Connection_String_Here') {
    throw new Error("CONNECTION_STRING is not set");
}
const APP_ENVIRONMENT = process.env.NEXT_PUBLIC_ENVIRONMENT_NAME;

if (!APP_ENVIRONMENT) {
    throw new Error("NEXT_PUBLIC_ENVIRONMENT_NAME is required");
}
if (APP_ENVIRONMENT === 'EnvironmentNameHere') {
    throw new Error("NEXT_PUBLIC_ENVIRONMENT_NAME is not set");
}

const connectionString = baseConnectionString + "/" + APP_ENVIRONMENT || 'dev'

const pool = new Pool({
    connectionString
});

const db = {
    query(text, params) {
        return pool.query(text, params);
    },
};

async function DBSetup() {
    await db.query(`CREATE SCHEMA IF NOT EXISTS audit;`);
    await db.query(`CREATE SCHEMA IF NOT EXISTS logs;`);
    await db.query(`CREATE SCHEMA IF NOT EXISTS usage;`);
    await db.query(`CREATE SCHEMA IF NOT EXISTS access_control;`);
    await db.query(`CREATE SCHEMA IF NOT EXISTS access_control_roles;`);
    await db.query(`CREATE SCHEMA IF NOT EXISTS ${SYSTEM_NAME};`);
    console.log("Creating Audit system for app. This will create a table to track changes to the database.")
    console.log("You will still need to add triggers to the tables you want to track.")
    await db.query(`BEGIN `)
    await db.query(`CREATE EXTENSION IF NOT EXISTS hstore;`);
    await db.query(`
            CREATE TABLE IF NOT EXISTS audit.${SYSTEM_NAME}
            (
                audit_id         SERIAL PRIMARY KEY,
                table_name       TEXT      NOT NULL,
                user_name        TEXT      NOT NULL,
                action_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                action           TEXT      NOT NULL CHECK (action IN ('i', 'd', 'u')),
                old_values       hstore,
                new_values       hstore,
                updated_cols     TEXT[],
                query            TEXT
            );
        `);
    await db.query(`
    create or replace function ${SYSTEM_NAME}_if_modified( ) returns trigger as $body$
    begin
        if tg_op = 'UPDATE' then
            insert into audit.${SYSTEM_NAME} (table_name, user_name, action, old_values, new_values, updated_cols, query)
            values (tg_table_name::text, current_user::text, 'u', hstore(old.*), hstore(new.*),
                   akeys(hstore(new.*) - hstore(old.*)), current_query());
            return new;
        elsif tg_op = 'DELETE' then
            insert into audit.${SYSTEM_NAME} (table_name, user_name, action, old_values, query)
            values (tg_table_name::text, current_user::text, 'd', hstore(old.*), current_query());
            return old;
        elsif tg_op = 'INSERT' then
            insert into audit.${SYSTEM_NAME} (table_name, user_name, action, new_values, query)
            values (tg_table_name::text, current_user::text, 'i', hstore(new.*), current_query());
            return new;
        end if;
    end;
    $body$
    language plpgsql;
    `);
    await db.query(`END; `);
    console.log(`Audit system created:  ${SYSTEM_NAME}_if_modified( )`)
    await db.query(`
        CREATE TABLE IF NOT EXISTS usage.${SYSTEM_NAME}
        (
            usage_id        BIGSERIAL PRIMARY KEY,
            session_id      TEXT,
            user_id         BIGINT,

            start_time      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            close_time      TIMESTAMP,
            visit_ended     BOOLEAN   DEFAULT FALSE,
            session_open    BOOLEAN   DEFAULT TRUE,

            status          TEXT,
            reason          TEXT,

            page            TEXT,
            page_key        TEXT,
            parent_page_key TEXT,

            time_away       INTERVAL,
            duration        INTERVAL GENERATED ALWAYS AS (
                CASE
                    WHEN close_time IS NULL THEN NULL
                    WHEN time_away IS NULL AND close_time IS NOT NULL THEN close_time - start_time
                    ELSE close_time - start_time - time_away
                    END
                ) STORED


        );
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS access_control.${SYSTEM_NAME}
        (
            id          SERIAL PRIMARY KEY,
            user_id     BIGINT NOT NULL,
            roles       TEXT[] DEFAULT '{"user"}',
            permissions TEXT[]
        );
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS access_control_roles.${SYSTEM_NAME}
        (
            role_name        TEXT PRIMARY KEY NOT NULL,
            role_description TEXT             NOT NULL,
            base_permissions TEXT[]           NOT NULL,
            created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at       TIMESTAMP,
            modified_by      BIGINT

        );
    `)
    await db.query(`
        INSERT INTO access_control_roles.${SYSTEM_NAME}
            (role_name, role_description, base_permissions)
        VALUES ('admin', 'Admin role', '{"view", "create", "remove", "update"}');
    `)
    await db.query(`
        INSERT INTO access_control.${SYSTEM_NAME}
            (user_id, roles, permissions)
        VALUES
            (2, '{"admin"}', NULL)
    `)
}



(async () => {
    try {
        await DBSetup()
    } catch (e) {
        console.log(e)
        process.exit(1)
    }

})()