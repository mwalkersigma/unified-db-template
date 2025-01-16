import {WEBSOCKET_URL} from "../../modules/utils/constants.js";
import {createContext, useEffect, useRef, useState} from "react";
import {useUser} from "../../modules/hooks/useUser.js";
import {socket} from "./socket.js";


export const SocketContext = createContext(null);
export function SocketProvider({children}) {
    const isLoggedIn = useRef(false);
    const [loginState, setLoginState] = useState(false);
    const user = useUser();


    useEffect(() => {
        const email = user.session?.user?.email;

        async function login(userEmail) {
            const response = await fetch(WEBSOCKET_URL + '/login', {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: userEmail,
                    password: 'no-password'
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Login successful");
                console.log("Data: ", data);
                isLoggedIn.current = true;
                setLoginState(true);
            } else {
                const text = await response.text();
                console.error("Login failed");
                console.error(text);
            }

        }
        if (!isLoggedIn.current && email) {
            login(email)
                .catch(err => console.error(err));
        }
    }, [user.session?.user?.email, setLoginState]);

    useEffect(() => {
        if (loginState && !socket.connected) {
            console.log("Connecting socket");
            socket.connect();
        }
        return () => {
            socket.disconnect();
        }
    }, [ loginState ]);

    return (
        <SocketContext.Provider value={{socket, isLoggedIn, loginState}}>
                {children}
        </SocketContext.Provider>
    )

}

