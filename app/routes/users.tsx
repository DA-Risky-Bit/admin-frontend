
import AdminSidebar from '../components/Sidebar'

import { useUsers, useCode } from '../lib/hooks'
import UserTable from '~/components/UserTable'

export default function UserContainer() {
  const { users, error: usersError } = useUsers()
  const {
    code,
    error: codeError,
    loading,
    regenerating,
    regenerateCode,
  } = useCode()

  return (
    <div className="flex h-screen bg-surface-sunken">
      <AdminSidebar />

      <main className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
        <div className="flex items-baseline gap-3 px-1 py-1.5 text-[15px]">
          <b>Users</b>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-surface p-3">
          <div>
            <p className="text-sm text-muted">Current Lobby Code</p>

            <p className="font-mono text-lg font-bold">
              {loading ? 'Loading...' : code || 'No code available'}
            </p>
          </div>

          <button
            onClick={regenerateCode}
            disabled={regenerating || loading}
            className="rounded-md bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Code'}
          </button>
        </div>

        {usersError && (
          <div className="px-1 text-danger">
            Error: {usersError}
          </div>
        )}

        {codeError && (
          <div className="px-1 text-danger">
            Error: {codeError}
          </div>
        )}

        <UserTable rows={users} />
      </main>
    </div>
  )
}
