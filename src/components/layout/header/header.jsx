import {
    AppShell,
    Avatar,
    Burger,
    Button,
    Group,
    Menu, rem,
    Text, Title,
    UnstyledButton,
    useMantineColorScheme
} from "@mantine/core";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import cx from "clsx";
import classes from "./header.module.css";
import { IconChevronDown, IconLogout, IconSwitchHorizontal } from "@tabler/icons-react";

export default function AppHeader({mobileOpened, toggleMobile, desktopOpened, toggleDesktop, ...props}) {
    const {setColorScheme, colorScheme} = useMantineColorScheme()
    const [userMenuOpened, setUserMenuOpened] = useState(false);
    const {data: session} = useSession();
    const user = session?.user;
    return (
        <AppShell.Header>
            <Group h="100%" justify="space-between">
                <Group h="100%" px="md">
                    <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm"/>
                    <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm"/>
                    <Text href={"/"} size="xl"> Incentive.forSigma </Text>
                </Group>
                <Title>{props.pageTitle}</Title>
                <Group h="100%">
                    {!user && (
                        <Button onClick={() => signIn("google")} variant="default" mr={'md'}>
                            Sign In
                        </Button>
                    )}
                    {user && (
                        <Menu
                            style={{justifySelf: "flex-end"}}
                            width={260}
                            position="bottom-end"
                            transitionProps={{transition: 'pop-top-right'}}
                            onClose={() => setUserMenuOpened(false)}
                            onOpen={() => setUserMenuOpened(true)}
                            withinPortal
                        >
                            <Menu.Target>
                                <UnstyledButton
                                    className={cx(classes.user, {[classes.userActive]: userMenuOpened})}
                                >
                                    <Group gap={7}>
                                        <Avatar imageProps={{referrerPolicy:"no-referrer"}} src={user.image} alt={user.name} radius="xl" size={20}/>
                                        <Text fw={500} size="sm" lh={1} mr={3}>
                                            {user.name}
                                        </Text>
                                        <IconChevronDown style={{width: rem(12), height: rem(12)}} stroke={1.5}/>
                                    </Group>
                                </UnstyledButton>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>Settings</Menu.Label>
                                <Menu.Item
                                    onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}>
                                    <Group gap={7}>
                                        <IconSwitchHorizontal style={{width: rem(16), height: rem(16)}}
                                                              stroke={1.5}/>
                                        <Text>Toggle theme</Text>
                                    </Group>
                                </Menu.Item>

                                <Menu.Item
                                    onClick={() => signOut()}
                                    leftSection={
                                        <IconLogout style={{width: rem(16), height: rem(16)}} stroke={1.5}/>
                                    }
                                >
                                    Logout
                                </Menu.Item>
                                {/*<Menu.Divider />*/}
                            </Menu.Dropdown>
                        </Menu>
                    )}
                </Group>
            </Group>
        </AppShell.Header>
    );

}