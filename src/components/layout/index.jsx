import {IconGauge} from "@tabler/icons-react";
import React, {useCallback, useState} from "react";
import useUsage from "../../modules/hooks/useUsage.js";
import {useDisclosure, useHeadroom} from "@mantine/hooks";
import {AppShell, ScrollArea, Text} from "@mantine/core";
import AppHeader from "./header/header.jsx";
import AppNavBar from "./navbar/navbar.jsx";

const size = "1.5rem";
const stroke = 2;

const pages = {
    // Top Level Keys make separate tabs.
    // Second Level Make Items on the Tab.
    // Third Level and beyond make the previous parent a folder.
    // Items can also use props for permission wrapper
    // roles, permissions, users to show/hide based on user
    "Tools" :{
        "Dashboard" : {
            href: "/",
            leftSection: <IconGauge size={size} stroke={stroke}/>,
        },
        "Parent Item " : {
            leftSection: <IconGauge size={size} stroke={stroke}/>,
            links: {
                "Child Item" : {
                    href: "/child",
                    leftSection: <IconGauge size={size} stroke={stroke}/>,
                },
                "Hidden Child Item" : {
                    href: "/hiddenChild",
                    leftSection: <IconGauge size={size} stroke={stroke}/>,
                    roles: ['admin']
                }
            }
        }
    },
    "Metrics" :{
        "Dashboard" : {
            href: "/metrics",
            leftSection: <IconGauge size={size} stroke={stroke}/>,
        },
    }
};
const footer = {
    "Admin": {
        "Dashboard": {
            href: "/admin",
            leftSection: <IconGauge size={size} stroke={stroke}/>,
        },
    }
}


export default function Layout({children}) {
    const [pageTitle, setPageTitle] = useState("");
    const [pageKey, setPageKey] = useState("");
    const [parentPageKey, setParentPageKey] = useState("");
    useUsage(parentPageKey, pageKey);

    const setKey = useCallback((key) => {
        if(pageKey !== key) {
            setPageKey(key);
        }
    }, [pageKey]);
    const setParentKey = useCallback((key) => {
        if(parentPageKey !== key) {
            setParentPageKey(key);
        }
    }, [parentPageKey]);
    const setTitle = useCallback((title) => {
        if(pageTitle !== title) {
            console.log("Setting title to: ", title);
            console.log("Current title is: ", pageTitle);
            setPageTitle(title);
        }
    }, [pageTitle]);

    const [mobileOpened, {toggle: toggleMobile}] = useDisclosure();
    const [desktopOpened, {toggle: toggleDesktop}] = useDisclosure(true);
    const [userMenuOpened, {toggle: toggleUserMenu}] = useDisclosure(true);

    const pinned = useHeadroom({fixedAt: 120});




    const appShellProps = {
        header: {
            height: 60,
            collapsed: !pinned,
        },
        padding: "md",
        aside: {
            breakpoint: 'lg',
            width: '20vw',
            collapsed: {
                mobile: true,
                desktop: userMenuOpened
            }
        },
        navbar: {
            width: 300, breakpoint: 'sm', collapsed: {
                mobile: !mobileOpened, desktop: !desktopOpened
            },
        }
    }
    const toggleProps = {
        mobileOpened, toggleMobile, desktopOpened, toggleDesktop, pageTitle
    }

    return (
        <AppShell {...appShellProps}>
            <AppHeader {...toggleProps}/>
            <AppNavBar links={pages} footer={footer}/>
            <AppShell.Main>
                <ScrollArea>
                    {children &&
                        React.cloneElement(children, {
                            toggleUserMenu,
                            userMenuOpened,
                            setKey,
                            setParentKey,
                            setTitle,
                        })
                    }
                </ScrollArea>
            </AppShell.Main>
            <AppShell.Aside id={'user-controls-aside'} w={'20vw'}></AppShell.Aside>
            <AppShell.Footer>
                <Text align="center" size="sm">© 2025 Sigma Equipment BSA</Text>
            </AppShell.Footer>
        </AppShell>
    );
}