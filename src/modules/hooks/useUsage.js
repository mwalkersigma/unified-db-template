import {useSession} from "next-auth/react";
import {
    readLocalStorageValue,
    readSessionStorageValue,
    useDocumentVisibility,
    useIdle, useLocalStorage, usePageLeave,
    useSessionStorage
} from "@mantine/hooks";
import Random from "another-random-package"
import {useCallback, useEffect, useMemo} from "react";
import {intervalToDuration} from "date-fns";
import {useRouter} from "next/router";

function addDuration(d1, d2) {
    let newDuration = {};
    for (let key in d1) {
        newDuration[key] = d1[key] + d2[key]
    }
    for (let key in d2) {
        if (!newDuration[key]) {
            newDuration[key] = d2[key]
        }
    }
    return newDuration;
}






export default function useUsage(key, parentKey, options = { debug: false }) {

    const router = useRouter();
    const idle = useIdle(1000 * 60 * 5);
    const {data: authSession} = useSession();
    const documentState = useDocumentVisibility();


    const [, setLastPage] = useSessionStorage({
        key: 'lastPage',
        defaultValue: null
    });
    const [, setSessionId] = useSessionStorage({
        key: 'sessionId',
        defaultValue: null
    });

    const [leaveTime, setLeaveTime] = useSessionStorage({
        key: 'leaveTime',
        defaultValue: null
    });
    const [timeAway, setTimeAway] = useSessionStorage({
        key: 'timeAway',
        defaultValue: null
    });

    const [previousSession, setPreviousSession] = useLocalStorage({key: 'previousSession'});


    const sessionData = useMemo(() => {
        let lastPage = readSessionStorageValue({key: 'lastPage'})
        let session = readSessionStorageValue({key: 'sessionId'})
        let previousSession = readLocalStorageValue({key: 'previousSession'});

        let hasSession = !!session;
        let hasPreviousSession = !!previousSession && previousSession !== 'null';
        const isSameSession = hasPreviousSession && previousSession?.sessionID === session;

        let isOnPage = !idle;

        const user = authSession?.user;

        const url = router.asPath

        return {
            sessionId: session,
            hasSession,

            previousSession,
            hasPreviousSession,
            isSameSession,
            url,
            lastPage,
            idle,
            isOnPage,
            user
        }
    }, [idle, authSession, router]);
    const currentVisit = useMemo(() => ({
        sessionID: sessionData.sessionId,
        user: sessionData.user,
        status: "User Active",
        reason: "Page Visited",
        visitEnded: false,
        sessionOpen: true,
        page: sessionData.url,
        key,
        parentKey,
        timeAway
    }), [key, parentKey, sessionData.sessionId, sessionData.url, sessionData.user, timeAway])

    const postUsage = useCallback((visit) => {
        const posted = navigator.sendBeacon("/api/usage", JSON.stringify(visit));
        if(options?.debug)console.log(`>>> Usage Posted: ${posted}`)
        setPreviousSession(null)
    }, [ options, setPreviousSession ])
    
    const handleAttentionReturn = useCallback(() => {
        if (leaveTime) {
            if(options?.debug)console.log(`>>> Attention State: Returned`)
            let currentTime = new Date()
            let currentTimeAway = intervalToDuration({
                start: leaveTime,
                end: currentTime
            })
            setTimeAway((prev) => {
                return addDuration(prev, currentTimeAway)
            })
            setLeaveTime(null)
            currentVisit.status = "User Active";
            currentVisit.reason = "User Returned";
            postUsage(currentVisit)

        }
    }, [options,leaveTime, postUsage, setLeaveTime, setTimeAway, currentVisit]);
    const handleAttentionLeave = useCallback(() => {
        if (!leaveTime) {
            if(options?.debug)console.log(`>>> Attention State: Left`)
            setLeaveTime(new Date())
            currentVisit.status = "User Inactive";
            currentVisit.reason = "User Left Page";
            postUsage(currentVisit)
        }
    }, [options,leaveTime, postUsage, setLeaveTime, currentVisit]);
    const handleLeavePage = useCallback(() => {
        setLastPage(sessionData.url)
    }, [sessionData, setLastPage]);
    const handleEnterPage = useCallback(() => {
        if(options?.debug)console.log(`>>> Navigation: from [ ${sessionData.lastPage} ] to [ ${sessionData.url} ]`)
        if (sessionData?.lastPage && sessionData.lastPage !== sessionData.url) {
            currentVisit.reason = "Navigated to new page"
            currentVisit.visitEnded = true;
            postUsage(currentVisit)
            setTimeAway(null);
            setLeaveTime(null);
            setLastPage(sessionData.url)
        }
    }, [options,postUsage, sessionData, setLastPage, setLeaveTime, setTimeAway, currentVisit]);
    const handleWindowClose = useCallback((e) => {
        // implement here
        if(e.type === "visibilitychange" && documentState !== "hidden") return;
        if(!currentVisit.sessionOpen) return;
        if(options?.debug)console.log(">>> Session Ended: ", currentVisit.sessionID)
        currentVisit.sessionOpen = false;
        currentVisit.visitEnded = true;
        currentVisit.status = "User Inactive";
        currentVisit.reason = "Session Ended";
        setTimeAway(null);
        setLeaveTime(null);
        setSessionId(null)
        postUsage(currentVisit)
    }, [documentState, currentVisit, options, setTimeAway, setLeaveTime, setSessionId, postUsage]);

    useEffect(() => {
        // handle attention management.
        if (sessionData.isOnPage && leaveTime) {
            handleAttentionReturn()
        }
        if (!sessionData.isOnPage && !leaveTime) {
            handleAttentionLeave()
        }
    }, [handleAttentionLeave, handleAttentionReturn, leaveTime, sessionData]);
    useEffect(() => {
        // initial load
        let session = readSessionStorageValue({key: 'sessionId'})
        if (session) return;
        if (typeof window !== 'undefined' && sessionData.user) {
            let generatedSessionId = Random.randomStringAlphaNumeric(25)
            setSessionId(generatedSessionId)
            if(options?.debug)console.log(">>> Session Started: ", generatedSessionId)
            postUsage({
                sessionID: generatedSessionId,
                user: sessionData.user,
                status: "Session Open",
                reason: "Session Started",
                visitEnded: false,
                sessionOpen: true,
                page: sessionData.url,
                key,
                parentKey,
            })
        }
    }, [options,key, parentKey, postUsage, sessionData, setSessionId]);
    useEffect(() => {
        if (!sessionData.hasSession) return;
        router.events.on('routeChangeStart', handleLeavePage)
        router.events.on('routeChangeComplete', handleEnterPage)
        addEventListener("visibilitychange", handleWindowClose);
        addEventListener("pagehide", handleWindowClose);
        return () => {
            router.events.off('routeChangeStart', handleLeavePage)
            router.events.off('routeChangeComplete', handleEnterPage)
            removeEventListener("visibilitychange", handleWindowClose)
            removeEventListener("pagehide", handleWindowClose)
        };
    }, [router, handleLeavePage, handleEnterPage, handleWindowClose, sessionData.hasSession]);
}

