"use client";

import { useEffect, useState } from "react";
import { fetchCIDs } from "@/services/dataVaultService";
import { Button } from "./ui/button";
import { ipfsDownload } from "@/services/ipfsService";
import { decryptWithKey } from "@/utils/encryption";
import { DataVault } from "@/constants/dataVault";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { HeartPulse } from "lucide-react";

export default function FilesSection({
  walletAddress,
  aesKey,
}: {
  walletAddress: `0x${string}` | undefined;
  aesKey: string | null;
}) {
  const [medicalData, setMedicalData] = useState<DataVault[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!walletAddress) return;
      try {
        const data = await fetchCIDs(walletAddress);
        setMedicalData(data);
      } catch (error) {
        console.error("Error fetching CIDs:", error);
      }
    };

    fetchData();
  }, [walletAddress]);

  const getFileContent = async (cid: string) => {
    if (!aesKey) return;
    try {
      const decryptedCid = decryptWithKey(cid, aesKey);
      const content = await ipfsDownload(decryptedCid);
      const decrypted = decryptWithKey(content, aesKey);
      return decrypted;
    } catch (error) {
      console.error("Failed to fetch IPFS content:", error);
      alert("Failed to load content.");
    }
  };

  const downloadContent = async (cid: string) => {
    const decrypted = await getFileContent(cid);
    if (!decrypted) return;

    const blob = new Blob([decrypted], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medical_data_${cid}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayContent = async (cid: string) => {
    const decrypted = await getFileContent(cid);
    if (!decrypted) return;

    const blob = new Blob([decrypted], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };
  const data = medicalData;
  const columns: ColumnDef<DataVault>[] = [
    {
      accessorKey: "details", // A new accessorKey for the card content
      header: "Details Card",
      cell: ({ row }) => {
        const item = row.original; // Access the full row data
        return (
          <Card className="w-full h-full bg-gray-50 fla">
            <CardHeader className="flex flex-row items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg flex items-center justify-center">
                <HeartPulse />
              </div>
              <CardTitle>{item.resource_type}</CardTitle>
              <CardDescription className="text-sm text-gray-600 break-words break-all"></CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                <strong>Uploaded: </strong>
                {new Date(item.created_at).toLocaleString()}
              </p>
              <Button onClick={() => displayContent(item.encrypted_cid)} disabled={!aesKey}>
                View Content
              </Button>
              <Button onClick={() => downloadContent(item.encrypted_cid)} disabled={!aesKey}>
                Download Content
              </Button>
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
      {medicalData.length === 0 ? (
        <div>No medical data found for this wallet.</div>
      ) : (
        <div className="w-full">
          {/* {medicalData.map((data, index) => (
            <div
              key={index}
              className="p-6 border rounded shadow bg-white flex flex-col justify-between space-y-2"
            >
              <div className="mb-2">
                <p className="text-sm text-gray-600 break-all">
                  <strong>CID:</strong> {data.encrypted_cid}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {data.resource_type}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Uploaded:</strong> {new Date(data.created_at).toLocaleString()}
                </p>
              </div>
              <Button onClick={() => displayContent(data.encrypted_cid)} disabled={!aesKey}>
                View Content
              </Button>
              <Button onClick={() => downloadContent(data.encrypted_cid)} disabled={!aesKey}>
                Download Content
              </Button>
            </div>
          ))} */}
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
