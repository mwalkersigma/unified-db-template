import {useQuery} from "@tanstack/react-query";

export function useRoles() {
    return useQuery({
        queryKey: ['accessControl', 'roles'],
        queryFn: async () => {
            return await fetch(`/api/admin/accessControl/roles`)
                .then(res => res.json())
        }
    });
}

export function useAccessControl(options) {

    let queryOptions = {
        queryKey: ['accessControl'],
        queryFn: async () => {
            return await fetch(`/api/admin/accessControl`)
                .then(res => res.json())
        }
    }
    if (options?.user) {
        const user_id = Number(options?.user?.id);
        queryOptions.enabled = !!options?.user && !!user_id;
        queryOptions.queryKey.push(String(user_id));
        queryOptions.queryFn = async () => {
            return await fetch(`/api/admin/accessControl/user/${user_id}`)
                .then(res => res.json())
        }
    }

    return useQuery(queryOptions);

}