import React, { useState, useEffect } from 'react';
import { Pagination } from './Pagination';
import { EmptyState } from '../loading/EmptyState';
import { Skeleton } from '../loading/Skeleton';

export const DataTable = ({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No data available',
  emptyMessage = 'There are no records matching your criteria.',
  itemsPerPage = 8,
  onRowClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-500">
              {columns.map((col, idx) => (
                <th key={idx} className={`py-3.5 px-6 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-6">
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 px-6 text-center">
                  <EmptyState title={emptyTitle} message={emptyMessage} />
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row._id || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition duration-150 ${
                    onRowClick ? 'cursor-pointer hover:bg-primary-50/40' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`py-4 px-6 align-middle ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && data.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={data.length}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
};
