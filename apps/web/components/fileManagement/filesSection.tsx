"use client";

import { useEffect, useState } from "react";
import { fetchCIDs } from "@/services/dataVaultService";
import { MedicalData } from "@/interfaces/medicalData";
import FileOperationDropDown from "./fileOperationDropDown";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, HeartPulse } from "lucide-react";
import FileSkeletonCard from "@/app/dashboard/components/fileSkeletonCard";
import eventBus from "@/lib/eventBus";

export default function FilesSection({
  walletAddress,
  aesKey,
}: {
  walletAddress: `0x${string}` | undefined;
  aesKey: string | null;
}) {
  const [medicalData, setMedicalData] = useState<MedicalData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
      setLoading(true);
      try {
        const data = await fetchCIDs(walletAddress);
        setMedicalData(data);
      } catch (error) {
        console.error("Error fetching CIDs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handler = () => {
      // Simply refetch; no payload filtering needed
      fetchData();
    };
    eventBus.on("medicalDataUploaded", handler);
    return () => {
      eventBus.off("medicalDataUploaded", handler);
    };
  }, [walletAddress]);

  const [data, setData] = useState(medicalData);

  useEffect(() => {
    setData(medicalData);
  }, [medicalData]);
  const columns: ColumnDef<MedicalData>[] = [
    {
      accessorKey: "details",
      header: "Details Card",
      cell: ({ row }) => {
        const data = row.original;
        return (
          <Card className="w-full h-full bg-gray-50 fla">
            <CardHeader className="flex flex-row items-center space-x-4 justify-between">
              <div className="flex flex-row items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg flex items-center justify-center">
                  <HeartPulse />
                </div>
                <div className="items-center">
                  <CardTitle>{data.resourceType}</CardTitle>
                  <p>
                    <strong>Uploaded: </strong>
                    {new Date(data.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <FileOperationDropDown
                walletAddress={walletAddress}
                aesKey={aesKey}
                setMedicalData={setMedicalData}
                data={data}
              />
            </CardHeader>
          </Card>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 4, // Set the page size to 4
      },
    },
  });

  if (!walletAddress) return <div>No wallet connected</div>;

  return (
    <div className="w-full p-6 pt-0">
      {loading ? (
        <FileSkeletonCard />
      ) : medicalData.length === 0 ? (
        <div>No medical data found for this wallet.</div>
      ) : (
        <div className="w-full">
          <Table>
            <TableCaption>A list of your data.</TableCaption>
            <TableHeader></TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              <ChevronLeft />
            </button>
            <span className="px-4">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
