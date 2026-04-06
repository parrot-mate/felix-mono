export type UploadType = "image" | "audio" | "json"

export interface UploadRouteConfig {
  path: string
  type: UploadType
  prefix: string
}

export const uploadRoutes: UploadRouteConfig[] = [
  {
    path: "/avatar",
    type: "image",
    prefix: "avatars",
  },
  {
    path: "/msg",
    type: "image",
    prefix: "messages",
  },
  {
    path: "/my-voice",
    type: "audio",
    prefix: "my-voice",
  },
  {
    path: "/file",
    type: "json",
    prefix: "books",
  },
]

const routeMap = new Map(uploadRoutes.map((route) => [route.path, route]))

export function getUploadRoute(path: string): UploadRouteConfig | undefined {
  return routeMap.get(path)
}
