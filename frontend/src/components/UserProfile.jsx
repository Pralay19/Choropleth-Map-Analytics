"use client"

import { useRef } from "react"
import { Avatar } from "primereact/avatar"
import { Menu } from "primereact/menu"
import { Button } from "primereact/button"

const UserProfile = ({ user, onLogout }) => {
  const dropDownRef = useRef(null)

  if (!user) return null

  return (
    <div style={{ marginBottom: 10, display: "flex", justifyContent: "end", alignItems: "center", gap: 10 }}>
      <div>
        <span style={{ color: "var(--primary-color)" }}>Hello</span>,
        <span style={{ fontSize: "1.5rem" }}>{user.name}</span>
      </div>
      <div style={{ flexGrow: 1 }}></div>
      <Avatar image={user.picture} size="large" shape="circle" imageFallback={`/images/fallback_profile_image.png`} />
      <Menu
        popup
        ref={dropDownRef}
        style={{ marginTop: "10px" }}
        model={[
          {
            label: "Logout",
            icon: "pi pi-sign-out",
            command: () => {
              onLogout()
            },
          },
        ]}
      />
      <Button icon="pi pi-angle-down" text onClick={(event) => dropDownRef.current.toggle(event)} />
    </div>
  )
}

export default UserProfile
