import pg from 'pg'
import {ENVIRONMENT} from "../utils/constants.js";
import { debug } from "../logger/index.js";
const { Pool } = pg

const baseConnectionString = process.env.CONNECTION_STRING
const connectionString = baseConnectionString + "/" + ENVIRONMENT || 'dev'

const pool = new Pool({
    connectionString
})

const query = async (text, params, callback) => {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    // debug('executed query', { text, duration, rows: res.rowCount })
    return res
}

const db = {
    query
}

export default db;