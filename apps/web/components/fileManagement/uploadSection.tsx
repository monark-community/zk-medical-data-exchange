import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checkCompliance, ComplianceResult } from "@/utils/compliance";
import { FhirResourceType, FhirResourceTypes } from "@/constants/fhirResourceTypes";
import { ReportType } from "@/constants/reportType";
import { Config, UseAccountReturnType } from "wagmi";
import { encryptWithKey } from "@/utils/encryption";
import RecordTypeSelect from "@/components/fileManagement/recordTypeSelect";
import { Upload, Loader2 } from "lucide-react";
import eventBus from "@/lib/eventBus";
import { ipfsUpload } from "@/services/storage";
import { uploadMedicalData } from "@/services/api";

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
      // TODO: Change this when we have more supported types
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
        alert("Failed to upload medical data.");
      }
    }
  };

  const onRecordTypeChange = (value: FhirResourceTypes) => {
    if (compliance?.resourceType !== value) {
      alert("Selected record type does not match file compliance. Please re-upload.");
      return;
    }
    setRecordType(value);
  };
  return (
    <>
      {!checking && !readyToSend && !uploading && (
        <Button onClick={handleUploadMedicalData} disabled={uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload medical data
            </>
          )}
        </Button>
      )}
      {uploadedFileName && (
        <div className="flex items-center gap-2 mt-2">
          <span>{uploadedFileName}</span>
          {checking ? (
            <span>⏳</span>
          ) : isCompliant === true ? (
            <span>FHIR ✔️</span>
          ) : isCompliant === false ? (
            <span>❌</span>
          ) : null}
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs"
            onClick={() => {
              setUploadedFileName(null);
              setUploadedFile(null);
              setIsCompliant(null);
              setReadyToSend(false);
            }}
          >
            Remove
          </button>
          {readyToSend && (
            <>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading}
                onClick={async () => {
                  if (account.status !== "connected") return;
                  if (!aesKey || !uploadedFile) return;

                  setUploading(true);
                  try {
                    const content = await uploadedFile.text();
                    const encryptedContent = encryptWithKey(content, aesKey);
                    const cid = await ipfsUpload(encryptedContent);
                    const encryptedCid = encryptWithKey(cid, aesKey);
                    const result = await uploadMedicalData(
                      account.address,
                      encryptedCid,
                      recordType
                    );

                    if (result) {
                      alert("Medical data uploaded successfully.");
                      eventBus.emit("medicalDataUploaded");
                    }

                    setUploadedFileName(null);
                    setUploadedFile(null);
                    setIsCompliant(null);
                    setReadyToSend(false);
                  } catch (error) {
                    console.error("Upload failed:", error);
                    alert("Failed to upload medical data. Please try again.");
                  } finally {
                    setUploading(false);
                  }
                }}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Confirm Send"
                )}
              </button>
              <RecordTypeSelect onValueChange={onRecordTypeChange} selectedValue={recordType} />
            </>
          )}
        </div>
      )}
    </>
  );
}
