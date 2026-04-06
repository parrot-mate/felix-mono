export const Endpoints = {
  hub: {
    ws: process.env.VITE_PUBLIC_HUB_WS_ENDPOINT!,
    h3: process.env.VITE_PUBLIC_HUB_H3_ENDPOINT!,
  },
  room: {
    ws: process.env.VITE_PUBLIC_ROOM_WS_ENDPOINT!,
    h3: process.env.VITE_PUBLIC_ROOM_H3_ENDPOINT!,
  },
}
