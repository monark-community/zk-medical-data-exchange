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
import {
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  FileText,
  Calendar,
  Activity,
  Stethoscope,
  FileStack,
  User,
  Code,
  Database,
  Settings,
  AlertCircle,
  FileCode,
  BookOpen,
  Binary,
  FileQuestion,
} from "lucide-react";
import eventBus from "@/lib/eventBus";
import { fetchCIDs } from "@/services/api";
import { Spinner } from "@/components/ui/spinner";

// Helper function to get icon and colors based on resource type
const getResourceTypeStyle = (resourceType: string) => {
  switch (resourceType) {
    case "Observation":
      return {
        icon: Activity,
        gradient: "from-emerald-500 to-teal-500",
      };
    case "Condition":
      return {
        icon: Stethoscope,
        gradient: "from-red-500 to-orange-500",
      };
    case "Patient":
      return {
        icon: User,
        gradient: "from-blue-500 to-indigo-500",
      };
    case "Bundle":
      return {
        icon: FileStack,
        gradient: "from-slate-500 to-gray-600",
      };
    case "Binary":
      return {
        icon: Binary,
        gradient: "from-purple-500 to-violet-500",
      };
    case "CapabilityStatement":
      return {
        icon: Settings,
        gradient: "from-cyan-500 to-sky-500",
      };
    case "CodeSystem":
      return {
        icon: Code,
        gradient: "from-amber-500 to-orange-500",
      };
    case "OperationDefinition":
      return {
        icon: FileCode,
        gradient: "from-indigo-500 to-purple-500",
      };
    case "OperationOutcome":
      return {
        icon: AlertCircle,
        gradient: "from-yellow-500 to-amber-500",
      };
    case "Parameters":
      return {
        icon: Database,
        gradient: "from-teal-500 to-cyan-500",
      };
    case "StructureDefinition":
      return {
        icon: BookOpen,
        gradient: "from-violet-500 to-fuchsia-500",
      };
    case "ValueSet":
      return {
        icon: FileText,
        gradient: "from-pink-500 to-rose-500",
      };
    case "NotSupported":
      return {
        icon: FileQuestion,
        gradient: "from-gray-400 to-gray-500",
      };
    default:
      // Fallback for any unknown types
      return {
        icon: HeartPulse,
        gradient: "from-blue-500 to-teal-500",
      };
  }
};

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
        const { icon: Icon, gradient } = getResourceTypeStyle(data.resourceType);

        return (
          <Card className="w-full border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
            <CardHeader className="flex flex-row items-center space-x-3 justify-between p-4">
              <div className="flex flex-row items-center space-x-3 flex-1 min-w-0">
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}
                >
                  <Icon className="text-white w-5 h-5" />
                </div>
                <div className="flex flex-col space-y-0.5 min-w-0 flex-1">
                  <CardTitle className="text-sm font-semibold text-gray-800 truncate">
                    {data.resourceType}
                  </CardTitle>
                  <div className="flex items-center text-xs text-gray-500 space-x-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {new Date(data.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <FileOperationDropDown
                  walletAddress={walletAddress}
                  aesKey={aesKey}
                  setMedicalData={setMedicalData}
                  data={data}
                />
              </div>
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
    <div className="w-full p-6 relative">
      {/* Deleting Overlay */}
      {deleting && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
          <div className="relative">
            <Spinner className="size-12 text-red-600" />
            <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-red-200 animate-ping opacity-75" />
          </div>
          <p className="mt-4 text-gray-700 font-semibold">Deleting file...</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="relative">
            <Spinner className="size-12 text-blue-600" />
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
