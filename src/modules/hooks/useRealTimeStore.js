import {useContext} from "react";
import {RealTimeContext} from "../../components/realTimeProvider/realTimeProvider.js";
import {useStore} from "zustand";


export function useRealTimeStore(selector ) {
    const realTimeStoreContext = useContext(RealTimeContext);

    if( !realTimeStoreContext ) {
        throw new Error('useChatStore must be used within a ChatProvider');
    }

    return useStore(realTimeStoreContext, selector);
}