"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdminTeam() {
  const team = useQuery(api.admin.administrators, {});
  return (
    <section className="panel" aria-label="Administrator team">
      <h2>Administrators</h2>
      {!team ? (
        <p role="status">Loading administrators…</p>
      ) : (
        <>
          <p>
            <strong>{team.total}</strong> administrator
            {team.total === 1 ? "" : "s"} configured
            {" · "}
            {team.active.length} active
            {team.pendingEmails.length > 0 &&
              ` · ${team.pendingEmails.length} awaiting sign-in`}
          </p>
          <div className="table-scroll">
            <table className="specs">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {team.active.map((person) => (
                  <tr key={person.email}>
                    <td>
                      {person.name}
                      {person.isYou && " (you)"}
                    </td>
                    <td>{person.email}</td>
                    <td>
                      <span className="badge">Administrator</span>
                    </td>
                  </tr>
                ))}
                {team.pendingEmails.map((email) => (
                  <tr key={email}>
                    <td>Awaiting sign-in</td>
                    <td>{email}</td>
                    <td>
                      <span className="badge">Admin on verified sign-in</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
