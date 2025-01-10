// @refresh reset
import {Badge, Box, Button, Container, Flex, List, SimpleGrid, Text, Title} from "@mantine/core";
import DataGrid from "../components/datagrid/index.js";
import {useQuery} from "@tanstack/react-query";
import {useSendCustomEvent, useSendMessage, useSocket, useSocketEvent} from "../modules/hooks/useSocketEvent.js";
import {useEffect, useState} from "react";

function APIStatus({ exampleData, isPending, internalData, internalIsPending }) {
    return(
        <List mb={'md'}>
            <List.Item>
                {isPending && <Text span> External Data Loading... </Text>}
                {!isPending && exampleData &&
                    <Text span>External API Data: {exampleData.length} items</Text>}
            </List.Item>
            <List.Item>
                {internalIsPending && <Text span> Internal Data Loading...</Text>}
                {!internalIsPending && internalData &&
                    <Text span>Internal API Data: {internalData.message}</Text>}
            </List.Item>
        </List>
    )
}

function SocketStatus() {
    /*
    The useSocket hook is a simple wrapper around useContext
    const socket_context = useContext(SocketContext);
    socket === socket_context.socket
*/
    const socket = useSocket();
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, [])
    const isClientAndConnected = isClient && socket.connected;
    return (
        <List>
            <List.Item>
                <Text span>
                    Socket Connected:
                    <Badge color={isClientAndConnected ? 'green' : 'red'}>
                        {isClientAndConnected ? 'Yes' : 'No'}
                    </Badge>
                </Text>
            </List.Item>
            <List.Item>
                <Text span>
                    Socket Transport:
                    <Badge color={isClientAndConnected ? 'blue' : 'red'}>
                        {isClientAndConnected && socket.io.engine.transport.name}
                    </Badge>
                </Text>
            </List.Item>
        </List>
    )

}

function SocketStation({ messages, setMessages}) {
    useSocketEvent(
        'client::listen::updates',
        (data) => {
            console.log('Received data: ', data);
            console.log('Messages: ', messages);
            console.log('Set Messages: ', setMessages);
            setMessages((prev) => [...prev, data]);
        }
    )

    const sendMessage = useSendMessage()
    const sendCustomEvent = useSendCustomEvent('my::custom::event');
    const handleMessageSend = () => {
        sendMessage("Hello from the client!");
    }
    const handleCustomEventSend = () => {
        sendCustomEvent("My Custom Payload!");
    }

    return (
        <Flex direction={'column'}>
            <Button mb={'sm'} onClick={handleMessageSend}> Say Hello! </Button>
            <Button mb={'sm'} onClick={handleCustomEventSend}> Send Custom Event </Button>
            <Text mb={'sm'} fz={'xs'}>To see this demo, duplicate this tab and click say hello in one tab to see a message appear in the other</Text>
            <details>
                <summary>messages {messages.length} </summary>
                {
                    messages.map((message, index) => (
                        <Text key={index}>{message}</Text>
                    ))
                }
            </details>

        </Flex>
    )
}


export default function IndexPage() {
    // External API Example
    const {data: exampleData, isPending} = useQuery({
        // You will see this log only twice in the console
        queryKey: ['exampleData'],
        queryFn: async () => {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            return await response.json();
        },
    });

    // Internal API Example
    const {data: internalData, isPending: internalIsPending} = useQuery({
        queryKey: ['internalData'],
        queryFn: async () => {
            // You will see this log only twice in the console
            console.log('fetching internal data');
            const response = await fetch('/api/v1/hello');
            return await response.json();
        },
    });

    // You will see these logs many times in the console
    // console.log('exampleData', exampleData);
    // console.log('internalData', internalData);
    const [messages, setMessages] = useState([])

    return (
        <Container h={'80vh'} size={'responsive'}>
            <Flex h={'100%'} direction={'column'}>
                <Title align={'center'} order={1} mb={'xl'}>Unified Template!</Title>
                <SimpleGrid mb={'lg'} cols={3}>
                    <APIStatus
                        exampleData={exampleData}
                        isPending={isPending}
                        internalData={internalData}
                        internalIsPending={internalIsPending}
                    />
                    <SocketStatus />
                    <SocketStation messages={messages} setMessages={setMessages} />
                </SimpleGrid>

                <Box flex={1}>
                    <DataGrid
                        rowData={exampleData}
                        columnDefs={[
                            {headerName: "ID", field: "id"},
                            {headerName: "Title", field: "title"},
                            {headerName: "Body", field: "body", flex: 1},
                        ]}
                    />
                </Box>
            </Flex>


        </Container>
    );
}
