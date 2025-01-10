import {WEBSOCKET_URL} from "../../modules/utils/constants.js";
import { io } from "socket.io-client";
import {createContext, useCallback, useEffect, useMemo, useRef, useState} from "react";
import SocketMock from "socket.io-mock";



export const SocketContext = createContext(null);


export function SocketProvider({children}) {
    const _socket = useRef(io(WEBSOCKET_URL));
    const socket = _socket.current;

    const isServer = typeof window === "undefined"

    const connectionRef = useRef(null);
    const transportRef = useRef(null);
    const registeredEventsRef = useRef({});

    

    const registerEvent = useCallback((event, cb) => {
        if(isServer) return;
        if (registeredEventsRef.current[event]) return;
        // ensure cb is a function
        if (typeof cb !== "function") {
            throw new Error(`cb must be a function, received ${typeof cb}`);
        }
        registeredEventsRef.current[event] = (data) => cb(data);
    }, [isServer]);


    useEffect(() => {
        if (socket.connected) {
            onConnect();
        }
        function onConnect() {
            console.log("connected");
            if(connectionRef.current === null) {
                transportRef.current = socket.io.engine.transport.name;
                connectionRef.current = true;
                socket.io.engine.on("upgrade", (transport) => {
                    transportRef.current = transport.name;
                });
            }
        }
        function onDisconnect() {
            connectionRef.current = false;
            transportRef.current = "N/A";
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        const registeredEvents = registeredEventsRef.current;

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            Object.keys(registeredEvents).forEach(event => {
                socket.off(event, registeredEvents[event]);
            });
        };
    }, [isServer, registeredEventsRef, socket]);
    useEffect(() => {
        let registeredEvents = Object.entries(registeredEventsRef.current);
        registeredEvents.forEach(([event, cb]) => {
            console.log("registering event", event);
            socket.on(event, cb);
        });
        return () => {
            registeredEvents.forEach(([event, cb]) => {
                console.log("unregistering event", event);
                socket.off(event, cb);
            });
        };
    }, [registeredEventsRef, socket]);


    
    return <SocketContext.Provider value={{ socket: isServer ? new SocketMock() : socket, registerEvent }}>
        {children}
    </SocketContext.Provider>
}