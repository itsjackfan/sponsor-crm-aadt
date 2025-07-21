import React from 'react';

interface TableColumn {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: TableColumn[];
  data: any[];
  className?: string;
}

export const Table: React.FC<TableProps> = ({ 
  columns, 
  data, 
  className = '' 
}) => {
  return (
    <>
      <div className={`table-container ${className}`}>
        <table className="table">
          <thead>
            <tr className="table-header-row">
              {columns.map((column) => (
                <th key={column.key} className="table-header-cell">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="table-row">
                {columns.map((column) => (
                  <td key={column.key} className="table-cell">
                    {column.render 
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style jsx>{`
        .table-container {
          background: var(--surface-glass);
          backdrop-filter: blur(12px);
          border-radius: var(--radius-card);
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: var(--shadow-glass);
          overflow: hidden;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-header-row {
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(8px);
        }

        .table-header-cell {
          padding: 20px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: left;
        }

        .table-row {
          transition: all var(--duration-normal) var(--easing-default);
        }

        .table-row:hover {
          background: rgba(14, 165, 233, 0.02);
        }

        .table-row:not(:last-child) {
          border-bottom: 1px solid rgba(241, 245, 249, 0.8);
        }

        .table-cell {
          padding: 20px;
          font-size: 15px;
          color: var(--text-primary);
          vertical-align: middle;
        }
      `}</style>
    </>
  );
};