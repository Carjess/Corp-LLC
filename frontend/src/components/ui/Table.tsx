import React from 'react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerStyle?: React.CSSProperties;
}

export const Table: React.FC<TableProps> = ({
  className = '',
  containerStyle,
  children,
  ...props
}) => {
  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: 'inherit',
        ...containerStyle,
      }}
    >
      <table className={`data-table ${className}`.trim()} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  ...props
}) => <thead {...props}>{children}</thead>;

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  ...props
}) => <tbody {...props}>{children}</tbody>;

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  children,
  ...props
}) => <tr {...props}>{children}</tr>;

export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  ...props
}) => <th {...props}>{children}</th>;

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  ...props
}) => <td {...props}>{children}</td>;

