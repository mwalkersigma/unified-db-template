export function parseBody(req) {
    let body = req.body;
    if(typeof body === 'string') {
        body = JSON.parse(body)
    }
    return body;
}