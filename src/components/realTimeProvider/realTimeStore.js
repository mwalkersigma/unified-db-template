import { createStore } from 'zustand/vanilla'


function insertAtRightOffset(messages, message) {
    // note: this won't work with id bigger than Number.MAX_SAFE_INTEGER
    message.mid = message.id ? parseInt(message.id, 10) : Infinity;

    for (let i = 0; i < messages.length; i++) {
        if (messages[i].id === message.id) {
            return false;
        }
        if (messages[i].mid > message.mid) {
            messages.splice(i, 0, message);
            return true;
        }
    }

    messages.push(message);
    return true;
}
const createStoreState = (initialState) => ({
    ...initialState,
    initialized: false,
    selectedChannelId: undefined,
    channels: new Map(),
    currentUser: {},
    users: new Map(),
    pendingUsers: new Map(),
    connected: false,
});

export const createRealTimeStore = (initialState) => createStore((set, get) => ({
    ...createStoreState(initialState),
    computed:{
        get selectedChannel(){
            return get().channels.get(get().selectedChannelId);
        },
        get messages () {
            return get().computed?.selectedChannel?.messages ?? []
        },
        get publicChannels(){
            const publicChannels = [];
            get().channels.forEach((channel) => {
                if (channel.type === "public") {
                    publicChannels.push(channel);
                }
            });
            publicChannels.sort((a, b) => {
                // always put the 'General' channel first
                if (a.name === "General") {
                    return -1;
                } else if (b.name === "General") {
                    return 1;
                }
                return b.name < a.name ? 1 : -1;
            });
            return publicChannels;
        },
        get privateChannels(){
            const privateChannels = [];
            get().channels.forEach((channel) => {
                if (channel.type === "private") {
                    privateChannels.push(channel);
                }
            });
            return privateChannels;
        },
        get someoneIsTyping(){
            let selectedChannel = get().computed.selectedChannel;
            if( selectedChannel.typingUsers.size){
                const usernames = [];
                selectedChannel.typingUsers.forEach((user) => {
                    usernames.push(user.username);
                });
                return usernames.join(", ") + " is typing...";
            }
            return "";
        }
    },

    // Actions
    addChannel: ( channel ) => set(state => {
        let newChannels = new Map(state.channels);
        if (newChannels.has(channel.id)) {
            const existingChannel = newChannels.get(channel.id);
            Object.keys(channel).forEach((key) => {
                existingChannel[key] = channel[key];
            })
            existingChannel.isLoaded = false;
            existingChannel.typingUsers.clear();
        } else {
            channel.messageInput = "";
            channel.messages = [];
            channel.hasMore = false;
            channel.isLoaded = false;
            channel.typingUsers = new Map();
            newChannels.set(channel.id, channel);
        }
        return { channels: newChannels };
    }),
    addMessage: ( message, countAsUnread = false ) => set(state => {
        const newChannels = new Map(state.channels);
        const channel = newChannels.get(message.channelId);
        if (!channel) {
            return;
        }
        const inserted = insertAtRightOffset(channel.messages, message);
        if (inserted && countAsUnread && message.from !== state.currentUser.id) {
            channel.unreadCount++;
        }
        return { channels: newChannels };
    }),
    setCurrentUser: (user) => set({currentUser: user}),

    sendMessage: async (content) => {
        const message = {
            id: '1234iuh1234iuhb',
            from: get().currentUser.id,
            channelId: get().selectedChannelId,
            content,
        };
        get().addMessage(message);
        const payload = {
            channelId: get().selectedChannelId,
            content,
        };
        const res = await get().socket.emitWithAck("message:send", payload);
        if (res.status === "OK") {
            message.id = res.data.id;
            message.mid = parseInt(message.id, 10);
        }
    },
    updateMessageInput: (messageInput) => {
      const channel = get().computed.selectedChannel;
        if (channel) {
            channel.messageInput = messageInput;
            let newChannels = new Map(get().channels);
            newChannels.set(channel.id, channel);
            set({channels: newChannels});
        }
    },

    getUser: async (userId) => {
        let currentUser = get().currentUser;
        if (currentUser.id === userId) {
            return currentUser;
        }
        let usersCopy = get().users;
        if (usersCopy.has(userId)) {
            return usersCopy.get(userId);
        }
        let pendingUsersCopy = get().pendingUsers;
        if (pendingUsersCopy.has(userId)) {
            console.log("Skipping user fetch for", userId);
            return pendingUsersCopy.get(userId);
        }
        let socket = get().socket;
        let promise = socket.emitWithAck("user:get", {userId})
            .then((res) => {
                if (res.status === "OK") {
                    let user = res.data;
                    usersCopy.set(userId, user);
                    set({users: new Map([...usersCopy])});
                    return user;
                }
            })
            .finally(() => {
                pendingUsersCopy.delete(userId);
                set({pendingUsers: new Map([...pendingUsersCopy])});
            });
        pendingUsersCopy.set(userId, promise);
        set({pendingUsers: new Map([...pendingUsersCopy])});
        return promise;
    },

    setUserOnline: (userId) => {
        let usersCopy = new Map(get().users);
        if (usersCopy.has(userId)) {
            usersCopy.get(userId).isOnline = true;
            set({users: usersCopy});
        }
    },
    setUserOffline: (userId) => {
        let usersCopy = new Map(get().users);
        if (usersCopy.has(userId)) {
            usersCopy.get(userId).isOnline = false;
            set({users: usersCopy});
        }
    },
    setUsersTyping: async (channelId, userId, isTyping) => {
        let channel = get().channels.get(channelId);
        if (!channel) {
            return;
        }
        if (isTyping) {
            let user = await get().getUser(userId);
            if (!user) {
                return;
            }
            channel.typingUsers.set(userId, user);
        } else {
            channel.typingUsers.delete(userId);
        }
        let newChannels = new Map(get().channels);
        newChannels.set(channelId, channel);
        set({channels: newChannels});
    },

    selectChannel: async (channelId) => {
        set({selectedChannelId: channelId});
        await get().loadMessagesForSelectedChannel();
    },
    setInitialized: (initialized) => set({initialized}),
    loadMessagesForSelectedChannel: async (order = 'backward', force = false) => {
        let channel = get().computed.selectedChannel;
        if (!channel || (channel.isLoaded && !force)) {
            return;
        }
        let query = {
            size: 20,
            channelId: get().selectedChannelId,
        }
        if (order === "backward") {
            query.orderBy = "id:desc";
            if (channel.messages.length) {
                query.after = channel.messages[0].id;
            }
        } else {
            query.orderBy = "id:asc";
            if (channel.messages.length) {
                query.after = channel.messages[channel.messages.length - 1].id;
            }
        }
        let socket = get().socket;
        const res = await socket.emitWithAck("message:list", query);
        if (res.status !== "OK") {
            return;
        }

        const messages = res?.data;
        messages.forEach((message) => get().addMessage(message));
        if (order === "forward" && res.hasMore) {
            return get().loadMessagesForSelectedChannel("forward");
        }

        channel.isLoaded = true;
        channel.hasMore = res.hasMore;
        await get().ackLastMessageIfNecessary();

        set({
            channels: new Map([...get().channels, [channel.id, channel]])
        })



    },
    ackLastMessageIfNecessary: async () => {
        if (get().selectedChannel?.unreadCount > 0) {
            await get().socket.emitWithAck("message:ack", {
                channelId: get().selectedChannel.id,
                messageId: get().selectedChannel.messages.at(-1).id,
            });
            get().selectedChannel.unreadCount = 0;
        }
    },



}));


