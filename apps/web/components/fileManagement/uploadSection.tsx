import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checkCompliance, ComplianceResult } from "@/utils/compliance";
import { FhirResourceType, FhirResourceTypes } from "@/constants/fhirResourceTypes";
import { ReportType } from "@/constants/reportType";
import { Config, UseAccountReturnType } from "wagmi";
import { encryptWithKey } from "@/utils/encryption";
import RecordTypeSelect from "@/components/fileManagement/recordTypeSelect";
import { Upload, X, Send, CheckCircle2, XCircle } from "lucide-react";
import eventBus from "@/lib/eventBus";
import { ipfsUpload } from "@/services/api/ipfsService";
import { uploadMedicalData } from "@/services/api";
import { Spinner } from "@/components/ui/spinner";
import { useTxStatusState } from "@/hooks/useTxStatus";

export default function UploadSection({
  account,
  aesKey,
}: {
  account: UseAccountReturnType<Config>;
  aesKey: string | null;
}) {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [checking, setChecking] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCompliant, setIsCompliant] = useState<boolean | null>(null);
  const [readyToSend, setReadyToSend] = useState(false);
  const [recordType, setRecordType] = useState<FhirResourceTypes>(FhirResourceType.NOT_SUPPORTED);
  const [compliance, setCompliance] = useState<ComplianceResult>({
    resourceType: FhirResourceType.NOT_SUPPORTED,
    reportType: ReportType.NOT_SUPPORTED,
  });
  const handleUploadMedicalData = async () => {
    if (account.status === "connected") {
      if (!aesKey) return;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.click();

      try {
        const fileSelected = await new Promise<boolean>((resolve) => {
          input.onchange = () => resolve(!!input.files && input.files.length > 0);
        });

        if (!fileSelected || !input.files) return;
        const file = input.files[0];
        // Generate simplified filename: just show original name in UI, use simplified for API
        setUploadedFileName(file.name);
        setUploadedFile(file);
        setChecking(true);

        const complianceResult = await checkCompliance(file);
        setCompliance(complianceResult);
        const isCompliant = complianceResult.reportType !== ReportType.NOT_SUPPORTED;

        setRecordType(complianceResult.resourceType);
        setIsCompliant(isCompliant);
        setChecking(false);
        setReadyToSend(isCompliant);

        if (!isCompliant) {
          //TODO: Implement UI feedback
        }

        console.log("Uploading file:", file.name);
      } catch (error) {
        console.error("Failed to upload medical data:", error);
        useTxStatusState.getState().showError("Failed to upload medical data.");
      }
    }
  };

  const onRecordTypeChange = (value: FhirResourceTypes) => {
    if (compliance?.resourceType !== value) {
      useTxStatusState
        .getState()
        .showError("Selected record type does not match file compliance. Please re-upload.");
      return;
    }
    setRecordType(value);
  };

  // Truncate filename to max 40 characters, showing start and end
  const truncateFilename = (filename: string, maxLength: number = 40): string => {
    if (filename.length <= maxLength) return filename;

    const extension = filename.split(".").pop() || "";
    const nameWithoutExt = filename.substring(0, filename.length - extension.length - 1);

    if (nameWithoutExt.length <= maxLength - extension.length - 4) return filename;

    const charsToShow = maxLength - extension.length - 4; // 4 for "..." and "."
    const frontChars = Math.ceil(charsToShow / 2);
    const backChars = Math.floor(charsToShow / 2);

    return `${nameWithoutExt.substring(0, frontChars)}...${nameWithoutExt.substring(
      nameWithoutExt.length - backChars
    )}.${extension}`;
  };
  return (
    <div className="space-y-4">
      {/* Main Upload Button */}
      {!checking && !readyToSend && !uploading && (
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-teal-500 to-blue-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
          <Button
            onClick={handleUploadMedicalData}
            disabled={uploading}
            size="lg"
            className="relative w-full sm:w-auto bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            <Upload className="mr-3 h-5 w-5" />
            Upload Medical Data
          </Button>
        </div>
      )}

      {/* File Preview Card */}
      {uploadedFileName && (
        <div className="border-2 border-gray-200 rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-all duration-200">
          <div className="space-y-4">
            {/* File Info Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate" title={uploadedFileName}>
                    {truncateFilename(uploadedFileName)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {checking ? (
                      <span className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Spinner className="size-4 text-blue-600" />
                        Checking compliance...
                      </span>
                    ) : isCompliant === true ? (
                      <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        FHIR Compliant
                      </span>
                    ) : isCompliant === false ? (
                      <span className="text-sm text-red-600 font-medium flex items-center gap-1.5">
                        <XCircle className="w-4 h-4" />
                        Not Compliant
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setUploadedFileName(null);
                  setUploadedFile(null);
                  setIsCompliant(null);
                  setReadyToSend(false);
                }}
                className="flex-shrink-0 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions Row */}
            {readyToSend && (
              <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200">
                <RecordTypeSelect onValueChange={onRecordTypeChange} selectedValue={recordType} />
                <Button
                  onClick={async () => {
                    if (account.status !== "connected") return;
                    if (!aesKey || !uploadedFile) return;

                    setUploading(true);
                    try {
                      const content = await uploadedFile.text();
                      const encryptedContent = encryptWithKey(content, aesKey);
                      const uploadResponse = await ipfsUpload(encryptedContent);
                      const encryptedCid = encryptWithKey(uploadResponse.cid, aesKey);
                      const result = await uploadMedicalData(
                        account.address,
                        encryptedCid,
                        recordType,
                        uploadResponse.fileId
                      );

                      if (result) {
                        eventBus.emit("medicalDataUploaded");
                        useTxStatusState.getState().show("Medical data uploaded successfully.");
                      }

                      setUploadedFileName(null);
                      setUploadedFile(null);
                      setIsCompliant(null);
                      setReadyToSend(false);
                    } catch (error) {
                      console.error("Upload failed:", error);
                      useTxStatusState
                        .getState()
                        .showError("Failed to upload medical data. Please check your file format and try again.");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading}
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  {uploading ? (
                    <>
                      <Spinner className="mr-2 size-4 text-blue-600" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Confirm & Send
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
