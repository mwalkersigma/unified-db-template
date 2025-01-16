import { io } from "socket.io-client";
import {WEBSOCKET_URL} from "../../modules/utils/constants.js";

const isBrowser = typeof window !== "undefined";

export const socket = isBrowser ? io(WEBSOCKET_URL, { autoConnect: false, withCredentials: true}) : {};