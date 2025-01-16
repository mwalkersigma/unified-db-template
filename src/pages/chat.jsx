import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActionIcon, Container, Flex, Group, Paper, ScrollArea, Tabs, Text, Textarea} from "@mantine/core";

import {useRealTimeStore} from "../modules/hooks/useRealTimeStore.js";
import {IconSend} from "@tabler/icons-react";


function UserName({userID, chatStore}) {
    const [userName, setUserName] = useState(null);
    useEffect(() => {
        chatStore.getUser(userID).then((user) => setUserName(user.username));
    }, [chatStore, userID]);
    return (
        <>
            {userName}
        </>

    )
}
const Chat = () => {
    const typingTimeoutRef = useRef(null);
    const [isTyping, setIsTyping] = useState(false);
    const store = useRealTimeStore((store) => store);
    const {publicChannels, messages} = store.computed;


    const handleChannelChange = useCallback((channelId) => {
        store.selectChannel(channelId)
    }, [store]);

    const handleInput = useCallback((e) => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            store.socket.emit("message:typing", {
                channelId: store.selectedChannelId,
                isTyping: false,
            });
        }, 1000);
        if( !isTyping ) {
            setIsTyping(true);
            store.socket.emit("message:typing", {
                channelId: store.selectedChannelId,
                isTyping: true,
            });
        }
        store.updateMessageInput(e.target.value);
    }, [isTyping, store]);

    const handleSendMessage = useCallback((message) => {
        const content = store.computed.selectedChannel.messageInput;
        if (!content) {
            return;
        }
        store.sendMessage(content);
        store.updateMessageInput("");
    }, [store]);

    return (
        <Container size={'responsive'}>
            <Tabs variant="pills" orientation="vertical" value={store.computed?.selectedChannel?.id}
                  onChange={handleChannelChange}>
                <Tabs.List>
                    {
                        publicChannels.map((channel) => {
                            return (
                                <Tabs.Tab key={channel.id} value={channel.id}>
                                    {channel.name}
                                </Tabs.Tab>
                            );
                        })
                    }
                </Tabs.List>
                {
                    publicChannels.map((channel) => {
                        return (
                            <Tabs.Panel h={'80vh'} key={channel.id} value={channel.id}>
                                <Container h={'100%'}>
                                    <Paper h={'100%'}>
                                        <Flex h={'100%'} direction={'column'} gap={'1rem'}>
                                            <Paper flex={1} mah={'60vh'} withBorder>
                                                <ScrollArea.Autosize h={'100%'}  mih={300} >
                                                    {messages.map((message) => {
                                                        return (
                                                            <Paper withBorder p={'1rem'} key={message.id}>
                                                                <Flex direction={'column'}>

                                                                </Flex>
                                                                <Text c={'dimmed'} fz={'xs'}>
                                                                    <UserName userID={message.from} chatStore={store}/>
                                                                </Text>
                                                                {message.content}
                                                            </Paper>
                                                        )
                                                    })}
                                                </ScrollArea.Autosize>
                                            </Paper>
                                            <Group
                                                w={'100%'}
                                                align={'flex-end'}
                                                justify={'flex-end'}
                                            >
                                                <Textarea
                                                    flex={1}
                                                    autosize
                                                    minRows={2}
                                                    rightSectionPointerEvents="all"
                                                    rightSection={
                                                        <ActionIcon onClick={handleSendMessage} size={'lg'} mr={'1rem'}>
                                                            <IconSend/>
                                                        </ActionIcon>
                                                    }
                                                    onChange={handleInput}
                                                    value={store.computed.selectedChannel.messageInput}
                                                />

                                            </Group>
                                            <Text c={'dimmed'} fz={'xs'}> {store.computed.someoneIsTyping} </Text>
                                        </Flex>
                                    </Paper>
                                </Container>
                            </Tabs.Panel>
                        );
                    })
                }
            </Tabs>

        </Container>
    );
};

export default Chat;