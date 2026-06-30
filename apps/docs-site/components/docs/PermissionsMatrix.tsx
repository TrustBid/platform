interface PermissionsMatrixProps {
  actions: string[];
  roles: { name: string }[];
  permissions: ("yes" | "no")[][];
}

export default function PermissionsMatrix({
  actions,
  roles,
  permissions,
}: PermissionsMatrixProps) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className="bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              Action
            </th>
            {roles.map((role) => (
              <th
                key={role.name}
                className="bg-gray-50 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {role.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {actions.map((action, rowIndex) => (
            <tr key={action}>
              <td className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
                {action}
              </td>
              {permissions[rowIndex]?.map((perm, colIndex) => (
                <td
                  key={colIndex}
                  className="border-b border-gray-100 px-4 py-3 text-center text-sm text-gray-700"
                >
                  {perm === "yes" ? "Yes" : "No"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
