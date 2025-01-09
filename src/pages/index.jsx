import {Box, Container, Flex, List, Title} from "@mantine/core";
import DataGrid from "../components/datagrid/index.js";
import {useQuery} from "@tanstack/react-query";

export default function IndexPage() {
    // External API Example
    const { data: exampleData, isPending } = useQuery({
        // You will see this log only twice in the console
        queryKey: ['exampleData'],
        queryFn: async () => {
            const response = await fetch('https://jsonplaceholder.typicode.com/posts');
            return await response.json();
        },
    });

    // Internal API Example
    const { data: internalData, isPending: internalIsPending } = useQuery({
        queryKey: ['internalData'],
        queryFn: async () => {
            // You will see this log only twice in the console
            console.log('fetching internal data');
            const response = await fetch('/api/v1/hello');
            return await response.json();
        },
    });
    // You will see these logs many times in the console
    console.log('exampleData', exampleData);
    console.log('internalData', internalData);



  return (
    <Container h={'80vh'} size={'responsive'}>
        <Flex h={'100%'} direction={'column'}>
            <Title align={'center'} order={1} mb={'xl'}>Unified Template!</Title>
            <List mb={'md'}>
                <List.Item>
                    You are ready to go!
                </List.Item>
            </List>
            { isPending && <p> External Data Loading...</p> }
            { !isPending && exampleData && <p>External API Data: {exampleData.length} items</p> }

            { internalIsPending && <p> Internal Data Loading...</p> }
            { !internalIsPending && internalData && <p>Internal API Data: {internalData.message}</p> }

            <Box flex={1}>
                <DataGrid
                    rowData={exampleData}
                    columnDefs={[
                        {headerName: "ID", field: "id"},
                        {headerName: "Title", field: "title"},
                        {headerName: "Body", field: "body"},
                    ]}
                />
            </Box>
        </Flex>


    </Container>
  );
}
