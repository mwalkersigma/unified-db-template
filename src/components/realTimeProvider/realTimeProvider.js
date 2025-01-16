import {createContext, useContext, useEffect, useRef} from "react";
import {createRealTimeStore} from "./realTimeStore.js";
import {SocketContext} from "../socket/socketProvider.jsx";
import {useStore} from "zustand";
import {WEBSOCKET_URL} from "../../modules/utils/constants.js";

export const RealTimeContext = createContext(null);

export function RealTimeProvider({children}) {
    const {socket} = useContext(SocketContext);
    const chatStoreRef = useRef(createRealTimeStore({socket}));
    const chatStore = useStore(chatStoreRef.current, state => state);
    const initialized = useStore(chatStoreRef.current, state => state['initialized']);

    useEffect(() => {
        async function initializeStore() {
            await fetch(WEBSOCKET_URL + '/self', {
                method: "GET",
                credentials: "include"
            })
                .then((res) => res.json())
                .then((data) => {
                    chatStore.setCurrentUser(data);
                    return data;
                })
                .catch((err) => {
                    console.error(err);
                    return null;
                });
            const res = await socket.emitWithAck("channel:list", {
                size: 100,
            });
            let channels = res?.['data'];
            if (channels) {
                channels.forEach((channel) => {
                    chatStore.addChannel(channel)
                })
            }
            chatStore.setInitialized(true);
            let publicRooms = chatStore.computed.publicChannels;
            let generalId = publicRooms[0]?.id;
            await chatStore.selectChannel(generalId);
            if (process.env.NODE_ENV !== "production") {
                socket.onAny((...args) => {
                    console.log("incoming", args);
                });
                socket.onAnyOutgoing((...args) => {
                    console.log("outgoing", args);
                });
                socket.on("connect_error", (err) => {
                    // the reason of the error, for example "xhr poll error"
                    console.log(err.message);

                    // some additional description, for example the status code of the initial HTTP response
                    console.log(err.description);

                    // some additional context, for example the XMLHttpRequest object
                    console.log(err.context);
                });
                socket.on("disconnect", (reason, details) => {
                    // the reason of the disconnection, for example "transport error"
                    console.log(reason);

                    // the low-level reason of the disconnection, for example "xhr post error"
                    console.log(details?.message);

                    // some additional description, for example the status code of the HTTP response
                    console.log(details?.description);

                    // some additional context, for example the XMLHttpRequest object
                    console.log(details?.context);
                });
            }
            socket.on("channel:created", (channel) => chatStore.addChannel(channel));
            socket.on("channel:joined", (channel) => chatStore.addChannel(channel));
            socket.on("message:sent", (message) => chatStore.addMessage(message, true));
            socket.on("user:connected", (userId) => chatStore.setUserOnline(userId));
            socket.on("user:disconnected", (userId) => chatStore.setUserOffline(userId));
            socket.on("message:typing", ({channelId, userId, isTyping}) => {
                chatStore.setUsersTyping(channelId, userId, isTyping);
            });
        }

        socket.on('connect', initializeStore);
        return () => {
            socket.off('connect', initializeStore);
        }
    }, [initialized]);
    return (
        <RealTimeContext.Provider value={chatStoreRef.current}>
            {children}
        </RealTimeContext.Provider>
    )
}