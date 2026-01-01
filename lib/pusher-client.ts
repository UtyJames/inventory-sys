import PusherClient from "pusher-js";

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

export const pusherClient = pusherKey 
  ? new PusherClient(pusherKey, { cluster: pusherCluster || "mt1" })
  : null;

if (!pusherKey) {
  console.warn("Pusher key not found. Real-time features will be disabled.");
}
