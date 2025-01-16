import {useSession} from "next-auth/react";

function findUser(users, userEmail) {
    if(!users || !users?.length) {
        return null;
    }
    return users.find(({email}) => email === userEmail);
}

export function useUser(users) {
    const {data: session, status} = useSession();

    if ( !session || !session?.user?.email || !users?.length) {
        return {user: null, status, session};
    }

    let baseUser = findUser(users, session.user.email);


    return {user: baseUser, status, session};
}