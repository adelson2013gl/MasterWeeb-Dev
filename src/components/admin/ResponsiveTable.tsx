
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeBadgeVariant } from "@/lib/typeGuards";

interface Props<T> {
  columns: ColumnDef<T>[];
  data: T[];
}

interface Column {
  type?: "badge" | "text" | "number" | "date";
  className?: string;
  render?: (value: any) => React.ReactNode;
  id?: string;
}

export function ResponsiveTable<T>({ columns, data }: Props<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderValue = (value: any, column: Column) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">N/A</span>;
    }

    if (column.type === "date") {
      try {
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch (error) {
        return <span className="text-gray-400 italic">Data Inválida</span>;
      }
    }

    if (column.type === 'badge') {
      return (
        <Badge variant={safeBadgeVariant(value)} className={column.className}>
          {column.render ? column.render(value) : value}
        </Badge>
      );
    }

    return value;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {renderValue(
                    cell.getValue(),
                    columns.find(
                      (column) => (column as any).id === cell.column.id
                    ) as Column
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
