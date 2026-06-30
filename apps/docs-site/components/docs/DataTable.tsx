interface DataTableProps {
  headers: string[];
  rows: (string | React.ReactNode)[][];
  highlightFirstColumn?: boolean;
}

export default function DataTable({
  headers,
  rows,
  highlightFirstColumn = false,
}: DataTableProps) {
  return (
    <div className="my-6 overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header || "col"}
                className="bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`border-b border-gray-100 px-4 py-3 text-sm text-gray-700 ${
                    highlightFirstColumn && cellIndex === 0 ? "font-medium text-gray-900" : ""
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
