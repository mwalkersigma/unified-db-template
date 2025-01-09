const winston = require('winston');
const {PostgresTransport} = require('@innova2/winston-pg');
const {SYSTEM_NAME, ENVIRONMENT} = require("../utils/constants.js");

const { NODE_ENV, LOGGING_ENABLED, UPLOAD_LOGS } = process.env;

const baseConnectionString = process.env.CONNECTION_STRING
const connectionString = baseConnectionString + "/" + ENVIRONMENT || 'dev'


const {combine, timestamp, json, colorize, align, printf, errors } = winston.format;
const timeStampFormatter = timestamp({format: 'MM-DD-YYYY hh:mm:ss.SSS A'})
const plainTextFormatter = printf((info) => {
    const {level, message, timestamp, ...meta} = info;
    let metaText;
    if (Object.entries(meta).length > 0) {
        metaText = JSON.stringify(Object.entries(meta).reduce((acc, [key, val]) => {
            acc[key] = val;
            return acc;
        }, {}));
    }
    return `[${timestamp}] ${level}: ${message} ${metaText ? metaText : ""}`
});
const CLI = combine(
    colorize(),
    timeStampFormatter,
    align(),
    plainTextFormatter
)

const cliTransport = new winston.transports.Console({
    format: CLI
});

const postgresTransport = new PostgresTransport({
    connectionString,
    maxPool: 10,
    level: 'info',
    schema: 'logs',
    tableName: `${SYSTEM_NAME}_logs`,
    format: combine(timestamp(), json()),
})

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(errors({stack: true}), timeStampFormatter, json()),
    exitOnError: false,
    defaultMeta: {service: SYSTEM_NAME},
})

if( LOGGING_ENABLED === 'false'){
    console.log("Logging is disabled");
}
if ( UPLOAD_LOGS === 'false'){
    console.log("Upload logs is disabled");
}

if (NODE_ENV !== 'production' || LOGGING_ENABLED === 'true') {
    logger.add(cliTransport)
}

if (UPLOAD_LOGS === 'true') {
    logger.add(postgresTransport)
}


module.exports = logger;