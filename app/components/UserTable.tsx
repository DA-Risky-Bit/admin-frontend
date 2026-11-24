import Panel from './Panel'

import type { User } from  '../lib/types'

const th = 'border-b border-border px-2.5 py-1.5 text-left font-semibold whitespace-nowrap'
const td = 'border-b border-border px-2.5 py-1.5 whitespace-nowrap'

export default function UserTable({ rows = [] }: { rows: User[]} ) {
  return (
    <Panel title="Users">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-surface-raised text-muted">
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Email</th>
              <th className={th}>Deleted</th>
              <th className={th}>Admin</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((user) => (
              <tr key={user.id} className="hover:bg-surface-raised">
                <td className={td}>{user.name}</td>
                <td className={`${td} text-muted`}>{user.email}</td>
                <td className={td}>
                  {user.deleted ? 'Yes' : 'No'}
                </td>
                <td className={td}>
                  {user.role ? 'Yes' : 'No'}
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-2.5 py-3 text-muted">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}
