import {useEffect, useMemo, useState} from "react";
import useUsers from "../../modules/hooks/useUsers.js";
import {useUser} from "../../modules/hooks/useUser.js";
import {useAccessControl} from "../../modules/hooks/useAccessControl.js";
import createOrgChart from "../../modules/classes/orgChart.js";
import {parseAccessControl} from "../../modules/utils/permission_utils.js";
import {accessControlSymbol, rolesSymbol} from "../../modules/utils/constants.js";
import {AccessControlContext} from "../../pages/_app.jsx";

export default function PermissionProvider({children}) {
    const [ready, setReady] = useState(false);
    const [ userWithAccess, setUserWithAccess ] = useState(null);

    const { data: users } = useUsers();

    const { user, status, session } = useUser(users);
    const { data: accessControl, isPending } = useAccessControl(user);
    const userName = useMemo(() => session?.user?.name, [session]);

    const orgChart = useMemo(() => createOrgChart(users), [users]);
    const descendants = useMemo(() => orgChart?.getDescendants(userName), [orgChart, userName]);
    const directReports = useMemo(()=> Object.values(orgChart?.has(userName)?.children ?? {}),[orgChart, userName]);
    const descendantIds = useMemo(() => descendants?.map(({id}) => id), [descendants]);

    const contextData = useMemo(() => ({
        user: userWithAccess,
        userName,
        status,
        session,
        ready,
        orgChart,
        descendants,
        directReports,
        descendantIds
    }), [descendantIds, descendants, directReports, orgChart, ready, session, status, userName, userWithAccess]);

    useEffect(() => {
        if(isPending)return;
        if(!user)return;
        if(!accessControl)return;

        const {userPermissions, roles} = parseAccessControl(accessControl);
        user.accessControl = userPermissions;
        user.roles = roles;

        user[accessControlSymbol] = userPermissions;
        user[rolesSymbol] = roles;

        setReady(true);
        setUserWithAccess(user);

    }, [accessControl, isPending, user]);

    return <AccessControlContext.Provider value={contextData}>
        {children}
    </AccessControlContext.Provider>
}