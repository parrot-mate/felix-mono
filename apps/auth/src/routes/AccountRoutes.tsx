import { Route } from "react-router-dom"
import { SelectProfilePage } from "../pages/SelectProfilePage"
import React from "react"
import { ProfileCreateFlow } from "../component/ProfileCreateFlow"
import { ProfileEditFlow } from "../component/ProfileEditFlow"

export const AccountRoutes = () => {
  return [
    <Route path="/select-profile" element={<SelectProfilePage />} />,
    <Route path="/create-profile" element={<ProfileCreateFlow />} />,
    <Route path="/edit-profile" element={<ProfileEditFlow />} />,
  ].map((x) => {
    return React.cloneElement(x, { key: x.props.path })
  })
}
