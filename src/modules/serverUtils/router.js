export default function router (routes) {
    return (req,res,...rest) => {
        let method = req.method || 'GET';
        let handler = routes[method.toUpperCase()];
        if(!handler) {
            res.status(405).send(`Method ${method} Not Allowed or Not Implemented`);
        }

        return handler(req,res,...rest);
    }
}
