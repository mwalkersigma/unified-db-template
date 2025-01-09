import {AppShell, Box, Divider, NavLink, ScrollArea, SegmentedControl, Space} from "@mantine/core";
import {useSessionStorage} from "@mantine/hooks";
import {useEffect} from "react";
import Link from "next/link";
import PermissionWrapper from "../../auth/permissionWrapper.jsx";

function GeneratedNavBar({page, count, keyName = "", state, handleToggle}) {
    if(page === undefined) return;
    return Object
        .entries(page)
        .map(([key, value], i) => {
            let href = value?.href;
            if (href) {
                const {href, roles, permissions, users, ...rest} = value;
                const hasWrapperProps = roles || permissions || users;
                if (hasWrapperProps) {
                    let wrapperProps = {roles, permissions, users}
                    return (
                        <PermissionWrapper key={`${key} ${i}`} {...wrapperProps} invisible>
                            <NavLink component={Link} {...rest} href={href} label={key}/>
                        </PermissionWrapper>
                    )
                }
                else {
                    return <NavLink component={Link} {...rest} key={`${key} ${i}`} href={href} label={key}/>
                }
            }
            else {
                let linkName = `${keyName} ${key} ${count++}`;
                const {links, roles, permissions, users, ...rest} = value;
                const hasWrapperProps = roles || permissions || users;
                rest.className = "subnav-link"
                if (hasWrapperProps) {
                    let wrapperProps = {roles, permissions, users}
                    return (
                        <PermissionWrapper key={linkName} {...wrapperProps} invisible>
                            <NavLink
                                key={linkName}
                                label={key}
                                onClick={() => handleToggle(linkName)}
                                opened={state[linkName]}
                                {...rest}
                            >
                                <GeneratedNavBar
                                    count={count}
                                    keyName={key}
                                    page={links}
                                    state={state}
                                    handleToggle={handleToggle}
                                />
                            </NavLink>
                        </PermissionWrapper>
                    )
                }
                else {
                    return (
                        <NavLink
                            key={linkName}
                            label={key}
                            onClick={() => handleToggle(linkName)}
                            opened={state[linkName]}
                            {...rest}
                        >
                            <GeneratedNavBar count={count} keyName={key} page={links} state={state}
                                             handleToggle={handleToggle}/>
                        </NavLink>
                    )
                }
            }
        })


}
function stateInit(page) {
    let temp = {}

    function createStateForPage(page, count = 0, keyName = "") {
        //console.log("Page :", page)
        if(page === undefined) return;
        return Object
            .entries(page)
            .forEach(([key, value]) => {
                let defaultState = false;
                let href = value?.href;
                if ( !href) {
                    let linkName = `${keyName} ${key} ${count++}`;
                    temp[linkName] = defaultState
                    createStateForPage(value.links, count, key)
                }
            })
    }

    createStateForPage(page)
    return temp
}


// depth-first key match
// takes an input object and a second object,
// it then deeply compares that both objects have the same keys
// it returns a boolean
function depthFirstKeySearch(original, objectToCompare) {
    if( typeof original !== "object" || typeof objectToCompare !== "object" ) return false;
    let keys = Object.keys(original);
    let compareKeys = Object.keys(objectToCompare);
    if( keys.length !== compareKeys.length ) return false;
    for ( let i = 0; i < keys.length; i++ ) {
        let key = keys[i];
        if( objectToCompare[key] === undefined ) return false;
        if( typeof original[key] === "object" ) {
            if( !depthFirstKeySearch(original[key], objectToCompare[key]) ) return false;
        }
    }
    return true;
}

export default function AppNavBar({links, footer}) {
    let count = 0
    let adminCount = 0
    let sections = Object.keys(links)

    const [section, setSection] = useSessionStorage({
        key: "navbar-section",
        defaultValue: sections[0]
    })
    const [state, setState] = useSessionStorage({
        key: "navbar",
        defaultValue: stateInit(links[section])
    });

    const [adminState, setAdminState] = useSessionStorage({
        key: "navbar-admin",
        defaultValue: stateInit(footer["Admin"])
    })

    useEffect(() => {
        // this is useful as multiple application use the same session storage names,
        // this prevents the navbar from messing with other applications
        let newState = stateInit(links[section])
        let hasSameKeys = depthFirstKeySearch(newState, state)
        if ( !hasSameKeys ){
            setState(newState)
        }
        let newAdminState = stateInit(footer["Admin"])
        let hasSameAdminKeys = depthFirstKeySearch(newAdminState, adminState)
        if ( !hasSameAdminKeys ){
            setAdminState(newAdminState)
        }
        if( !sections.includes(section) ){
            setSection(sections[0])
        }
    },[section, links, state, setState, footer, adminState, sections, setAdminState, setSection])


    const handleToggle = (key) => {
        setState((current) => ({...current, [key]: !current[key]}))
    }
    const handleAdminToggle = (key) => {
        setAdminState((current) => ({...current, [key]: !current[key]}))
    }




    return (
        <AppShell.Navbar p="md">
            <Box mb={'md'}>
                <SegmentedControl
                    data={sections}
                    value={section}
                    onChange={setSection}
                    fullWidth
                    mb={'md'}
                />
                <Divider/>
            </Box>


            <ScrollArea>
                <GeneratedNavBar state={state} handleToggle={handleToggle} page={links[section]} count={count}/>
                <Space h={'3rem'}/>
            </ScrollArea>
            <PermissionWrapper invisible roles={['admin']}>
                <Box>
                    <Divider mb={'md'}/>
                    <GeneratedNavBar
                        state={adminState}
                        handleToggle={handleAdminToggle}
                        page={footer["Admin"]}
                        count={adminCount}
                    />
                </Box>
            </PermissionWrapper>
        </AppShell.Navbar>
    )
}