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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { HeartPulse } from "lucide-react";
import FileSkeletonCard from "@/app/dashboard/components/fileSkeletonCard";

export default function FilesSection({
  walletAddress,
  aesKey,
}: {
  walletAddress: `0x${string}` | undefined;
  aesKey: string | null;
}) {
  const [medicalData, setMedicalData] = useState<MedicalData[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
      setLoading(true); // Set loading to true before fetching
      try {
        const data = await fetchCIDs(walletAddress);
        setMedicalData(data);
      } catch (error) {
        console.error("Error fetching CIDs:", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchData();
  }, [walletAddress]);

  const data = medicalData;
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
                <CardTitle>{data.resourceType}</CardTitle>
              </div>
              <FileOperationDropDown
                walletAddress={walletAddress}
                aesKey={aesKey}
                setMedicalData={setMedicalData}
                data={data}
              />
            </CardHeader>
            <CardContent>
              <div>
                <p>
                  <strong>Uploaded: </strong>
                  {new Date(data.createdAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
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
  });

  if (!walletAddress) return <div>No wallet connected</div>;

  return (
    <div className="w-full p-6 pt-0">
      {loading ? ( // Show FileSkeletonCard while loading
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
        </div>
      )}
    </div>
  );
}
