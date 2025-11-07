"use client";

import { useEffect, useState } from "react";
import { MedicalData } from "@/interfaces/medicalData";
import FileOperationDropDown from "./fileOperationDropDown";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, HeartPulse, FileText, Calendar, Loader2 } from "lucide-react";
import eventBus from "@/lib/eventBus";
import { fetchCIDs } from "@/services/api";

export default function FilesSection({
  walletAddress,
  aesKey,
}: {
  walletAddress: `0x${string}` | undefined;
  aesKey: string | null;
}) {
  const [medicalData, setMedicalData] = useState<MedicalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
      setLoading(true);
      try {
        const data = await fetchCIDs(walletAddress);
        // Sort by createdAt in descending order (most recent first)
        const sortedData = data.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setMedicalData(sortedData);
      } catch (error) {
        console.error("Error fetching CIDs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const handler = () => {
      fetchData();
    };
    const deletingHandler = () => {
      setDeleting(true);
    };
    const deletedHandler = () => {
      setDeleting(false);
    };

    eventBus.on("medicalDataUploaded", handler);
    eventBus.on("medicalDataDeleting", deletingHandler);
    eventBus.on("medicalDataDeleted", deletedHandler);
    return () => {
      eventBus.off("medicalDataUploaded", handler);
      eventBus.off("medicalDataDeleting", deletingHandler);
      eventBus.off("medicalDataDeleted", deletedHandler);
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
          <Card className="w-full border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center space-x-4 justify-between p-6">
              <div className="flex flex-row items-center space-x-4 flex-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
                  <HeartPulse className="text-white w-7 h-7" />
                </div>
                <div className="flex flex-col space-y-1">
                  <CardTitle className="text-lg font-semibold text-gray-800">
                    {data.resourceType}
                  </CardTitle>
                  <div className="flex items-center text-sm text-gray-500 space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(data.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
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
        pageSize: 4,
      },
    },
  });

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Wallet Connected</h3>
        <p className="text-gray-500 text-center">Please connect your wallet to view medical data</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 pt-0 relative">
      {/* Deleting Overlay */}
      {deleting && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-red-200 animate-ping opacity-75" />
          </div>
          <p className="mt-4 text-gray-700 font-semibold">Deleting file...</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-blue-200 animate-ping opacity-75" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your medical files...</p>
        </div>
      ) : medicalData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Medical Data Found</h3>
          <p className="text-gray-500 text-center max-w-md">
            You haven't uploaded any medical records yet. Upload your first file to get started.
          </p>
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{medicalData.length}</span> file
              {medicalData.length !== 1 ? "s" : ""}
            </div>
          </div>

          <Table>
            <TableHeader className="hidden"></TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="border-none hover:bg-transparent"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-0 py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <span className="text-gray-500">No results found</span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-gray-700">
                  Page{" "}
                  <span className="font-semibold">{table.getState().pagination.pageIndex + 1}</span>{" "}
                  of <span className="font-semibold">{table.getPageCount()}</span>
                </span>
              </div>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
