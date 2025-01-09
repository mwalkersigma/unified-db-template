import {useQuery} from "@tanstack/react-query";
import jsConvert from "js-convert-case";


export default function useUsers(){
    return useQuery({
        queryKey:['users'],
        queryFn: async () => fetch('http://10.100.100.51:3002/user')
            .then(res => res.json())
            .then(data => {
                let users = data?.data?.filter(({Group}) => Group !== "room") ?? [];
                return users.map( user => jsConvert.snakeKeys(user));
            })
        ,
    })
}