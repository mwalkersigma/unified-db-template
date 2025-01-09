import GoogleProvider from 'next-auth/providers/google';
import NextAuth, {getServerSession} from "next-auth";

export const authOptions = {
    providers: [GoogleProvider({
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        authorization: {
            params: {
                prompt: "consent",
                access_type: "offline",
                response_type: "code"
            }
        },
        profile(profile) {
            return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture
            }
        }
    })],
    callbacks:{
        async redirect({url, baseUrl}) {
            const redirectUrl = url.startsWith('/') ? new URL(url, baseUrl).toString() : url;
            console.log(`[next-auth] Redirecting to "${redirectUrl}" (resolved from url "${url}" and baseUrl "${baseUrl}")`);
            return redirectUrl;
        }
    }
}
export function auth(...args) {
    return getServerSession(...args, authOptions)
}
export default NextAuth(authOptions)