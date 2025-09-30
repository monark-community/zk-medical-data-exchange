import { useState } from "react";
import { Button } from "@/components/ui/button";
import { checkCompliance, ComplianceResult } from "@/utils/compliance";
import { FhirResourceType, FhirResourceTypes } from "@/constants/fhirResourceTypes";
import { ReportType } from "@/constants/reportType";
import { Config, UseAccountReturnType } from "wagmi";
import { encryptWithKey } from "@/utils/encryption";
import { ipfsUpload } from "@/services/ipfsService";
import { uploadMedicalData } from "@/services/dataVaultService";
import RecordTypeSelect from "@/components/fileManagement/recordTypeSelect";
import { Upload } from "lucide-react";
import eventBus from "@/lib/eventBus";
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
      <Button onClick={handleUploadMedicalData}>
        <Upload /> Upload medical data
      </Button>
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
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                onClick={async () => {
                  if (account.status !== "connected") return;
                  if (!aesKey || !uploadedFile) return;
                  const content = await uploadedFile.text();
                  const encryptedContent = encryptWithKey(content, aesKey);
                  const cid = await ipfsUpload(encryptedContent);
                  const encryptedCid = encryptWithKey(cid, aesKey);
                  const result = await uploadMedicalData(account.address, encryptedCid, recordType);

                  if (result) {
                    alert("Medical data uploaded successfully.");
                    eventBus.emit("medicalDataUploaded");
                  }

                  setUploadedFileName(null);
                  setUploadedFile(null);
                  setIsCompliant(null);
                  setReadyToSend(false);
                }}
              >
                Confirm Send
              </button>
              <RecordTypeSelect onValueChange={onRecordTypeChange} selectedValue={recordType} />
            </>
          )}
        </div>
      )}
    </>
  );
}
