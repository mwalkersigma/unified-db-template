import {useSession} from "next-auth/react";
import {useEffect, useState} from "react";

function findUser(users, userEmail) {
    return users.find(({email}) => email === userEmail);
}
export function useUser(users) {
    const {data: session, status} = useSession();
    const [user, setUser] = useState(null);
    useEffect(() => {
        if (!users || !session?.user?.email) return;
        let baseUser = findUser(users, session.user.email);
        if (!baseUser) {
            return;
        }
        if (user === null) {
            console.log("Setting User")
            setUser(baseUser);
        }
    }, [session, user, users]);
    return {user, status, session};
}