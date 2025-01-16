import {SocketContext} from "../../components/socket/socketProvider.jsx";
import {useContext} from "react";


export function useSocket(){
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context.socket;
}