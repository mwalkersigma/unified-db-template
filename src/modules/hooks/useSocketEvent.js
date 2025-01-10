import {SocketContext} from "../../components/socket/socketProvider.jsx";
import {useContext} from "react";






export function useSendMessage(){
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('sendMessage must be used within a SocketProvider');
    }
    return (data) => context.socket.emit('message',data);
}

export function useSendCustomEvent(event) {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('sendCustomEvent must be used within a SocketProvider');
    }
    return (data) => context.socket.emit(event, data);
}
export function useSocketEvent(event, cb) {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocketEvent must be used within a SocketProvider');
    }
    context.registerEvent(event, cb);
}

export function useSocket(){
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context.socket;
}