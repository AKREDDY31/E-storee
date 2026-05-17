"use client";

import { useState } from "react";

export function AdminUsersClient({ users }: { users: any[] }) {
  const [currentUsers, setCurrentUsers] = useState(users);
  const subscribedUsers = currentUsers.filter((user) => user.subscriptionStatus === "verified");
  const pendingUsers = currentUsers.filter((user) => user.subscriptionStatus === "pending");

  async function updateSubscription(userId: string, action: "approve" | "reject") {
    const response = await fetch(`/api/admin/users/${userId}/subscription`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action })
    });
    const data = await response.json();
    if (!response.ok) return;
    setCurrentUsers((current) => current.map((user) => (user._id === userId ? { ...user, ...data.user } : user)));
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h1 style={{ margin: 0 }}>Users and admins</h1>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="card" style={{ padding: 20 }}>
          <strong>Total users</strong>
          <div style={{ fontSize: 28, marginTop: 8 }}>{users.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <strong>Subscribed users</strong>
          <div style={{ fontSize: 28, marginTop: 8 }}>{subscribedUsers.length}</div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <strong>Pending payments</strong>
          <div style={{ fontSize: 28, marginTop: 8 }}>{pendingUsers.length}</div>
        </div>
      </div>
      {subscribedUsers.length ? (
        <div className="card" style={{ padding: 24, display: "grid", gap: 12 }}>
          <strong>Subscribed list</strong>
          {subscribedUsers.map((user) => (
            <div key={user._id} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              <div>
                <strong>{user.name}</strong>
                <div style={{ color: "var(--muted)" }}>{user.subscriptionPhone || user.phone || "No phone"}</div>
              </div>
              <span className="pill">Subscribed</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="card" style={{ padding: 24, display: "grid", gap: 14 }}>
        {users.map((user) => (
          <div key={user._id} style={{ display: "grid", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong>{user.name}</strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {user.subscriptionStatus === "verified" ? <span className="pill">Subscribed</span> : null}
                {user.subscriptionStatus === "pending" ? <span className="pill">Pending</span> : null}
                <span className="pill">{user.role}</span>
              </div>
            </div>
            <div style={{ color: "var(--muted)" }}>{user.email}</div>
            <div style={{ color: "var(--muted)" }}>{user.phone || "No phone added"}</div>
            {user.subscriptionStatus === "verified" ? <div style={{ color: "var(--muted)" }}>Subscription phone: {user.subscriptionPhone || user.phone || "Not set"}</div> : null}
            {user.subscriptionStatus === "pending" ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="button" type="button" onClick={() => updateSubscription(user._id, "approve")}>Approve subscription</button>
                <button className="button secondary" type="button" onClick={() => updateSubscription(user._id, "reject")}>Reject</button>
              </div>
            ) : null}
            {user.address ? (
              <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
                Delivery: {user.address.fullName}, {user.address.phone}, {user.address.line1}
                {user.address.line2 ? `, ${user.address.line2}` : ""}, {user.address.city}, {user.address.state} - {user.address.postalCode}
                {user.address.landmark ? `, Landmark: ${user.address.landmark}` : ""}
              </div>
            ) : (
              <div style={{ color: "var(--muted)" }}>No saved delivery address</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
