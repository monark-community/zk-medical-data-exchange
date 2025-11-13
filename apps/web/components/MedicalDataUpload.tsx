"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import {
  uploadStudyData,
  getStudyPublicKey,
  checkParticipantDataStatus,
} from '@/services/api/studyDataService';
import { encryptMedicalDataForUpload } from '@/utils/encryption';

interface MedicalDataUploadProps {
  studyId: number;
  studyTitle: string;
  onUploadComplete?: () => void;
}

export function MedicalDataUpload({ studyId, studyTitle, onUploadComplete }: MedicalDataUploadProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUploaded, setHasUploaded] = useState(false);
  const [uploadedAt, setUploadedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    checkUploadStatus();
  }, [studyId, address]);

  const checkUploadStatus = async () => {
    if (!address) return;

    try {
      const status = await checkParticipantDataStatus(
        studyId,
        address
      );
      setHasUploaded(status.hasUploadedData);
      setUploadedAt(status.uploadedAt);
    } catch (error) {
      console.error('Error checking upload status:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (JSON or FHIR format)
      if (!file.name.endsWith('.json')) {
        setError('Please select a valid JSON file');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !address) {
      setError('Missing required data');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Read file content
      const fileContent = await selectedFile.text();
      const medicalData = JSON.parse(fileContent);

      // 2. Get study's public key
      const publicKeyResponse = await getStudyPublicKey(studyId);

      // 3. Encrypt medical data
      const { encryptedData, encryptedKey } = await encryptMedicalDataForUpload(
        medicalData,
        publicKeyResponse.publicKey
      );

      // 4. Compute hash of the original data
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(fileContent);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const dataHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // 5. Extract IV and auth tag from encrypted data
      // The encryptedData is base64 encoded and contains IV (first 12 bytes) + ciphertext
      const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      const iv = btoa(String.fromCharCode(...encryptedBuffer.slice(0, 12)));
      const authTag = ''; // AES-GCM auth tag is included in the ciphertext

      // 6. Upload to backend
      await uploadStudyData(studyId, {
        participantAddress: address,
        encryptedData,
        encryptionMetadata: {
          encryptedKey,
          iv,
          authTag,
        },
        dataHash,
      });

      setSuccess(true);
      setHasUploaded(true);
      setUploadedAt(new Date().toISOString());
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to upload data');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasUploaded) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle>Data Already Submitted</CardTitle>
          </div>
          <CardDescription>
            You have already submitted your medical data to this study
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Study:</strong> {studyTitle}
            </p>
            {uploadedAt && (
              <p>
                <strong>Submitted:</strong> {new Date(uploadedAt).toLocaleDateString()} at{' '}
                {new Date(uploadedAt).toLocaleTimeString()}
              </p>
            )}
            <Alert className="mt-4">
              <AlertDescription>
                Your encrypted data is securely stored. It will only be used for aggregated
                analysis once the study ends.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" />
          <CardTitle>Upload Medical Data</CardTitle>
        </div>
        <CardDescription>
          Submit your encrypted medical data to participate in: <strong>{studyTitle}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Selection */}
        <div>
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <FileText className="h-8 w-8 text-gray-400 mb-2" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">Medical data in JSON format (FHIR compatible)</p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isLoading}
            />
          </label>
          
          {selectedFile && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {selectedFile.name}
            </div>
          )}
        </div>

        {/* Privacy Notice */}
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Privacy Protection:</strong> Your data will be encrypted with the study's public
            key before upload. Only aggregated, anonymized statistics will be shared with
            researchers - your individual data remains private.
          </AlertDescription>
        </Alert>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your medical data has been encrypted and uploaded successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Encrypting and Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Encrypted Data
            </>
          )}
        </Button>

        {/* How It Works */}
        <div className="mt-4 pt-4 border-t text-sm text-gray-600 space-y-2">
          <p className="font-semibold">How it works:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Your medical data is encrypted locally in your browser</li>
            <li>Encrypted data is uploaded to secure storage</li>
            <li>Only you and the aggregation system can access the encrypted data</li>
            <li>After study ends, data is aggregated and anonymized</li>
            <li>Researchers receive only statistical summaries</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
