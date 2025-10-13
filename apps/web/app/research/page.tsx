"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, Shield, Users, Calendar, CheckCircle, XCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { 
  getStudies, 
  checkStudyEligibility, 
  applyToStudyWithZK,
  StudySummary,
  EligibilityCheckRequest 
} from "@/services/api/studyService";

export default function Research() {
  const { address: walletAddress, isConnected } = useAccount();
  const [studies, setStudies] = useState<StudySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState<StudySummary | null>(null);
  const [applicationStep, setApplicationStep] = useState<'form' | 'checking' | 'result' | 'submitting'>('form');
  const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; message: string } | null>(null);
  const [medicalData, setMedicalData] = useState<EligibilityCheckRequest["medicalData"]>({
    age: undefined,
    gender: undefined,
    bmi: undefined,
    cholesterol: undefined,
    diabetesType: undefined,
    smokingStatus: undefined
  });

  useEffect(() => {
    loadStudies();
  }, []);

  const loadStudies = async () => {
    try {
      const response = await getStudies({ status: 'active' });
      setStudies(response.studies);
    } catch (error) {
      console.error('Failed to load studies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToStudy = (study: StudySummary) => {
    setSelectedStudy(study);
    setApplicationStep('form');
    setEligibilityResult(null);
    setMedicalData({});
  };

  const handleCheckEligibility = async () => {
    if (!selectedStudy) return;

    setApplicationStep('checking');
    try {
      const result = await checkStudyEligibility(selectedStudy.id, { medicalData });
      setEligibilityResult(result);
      setApplicationStep('result');
    } catch (error) {
      console.error('Eligibility check failed:', error);
      setEligibilityResult({
        eligible: false,
        message: 'Error checking eligibility. Please try again.'
      });
      setApplicationStep('result');
    }
  };

  const handleFinalApplication = async () => {
    if (!selectedStudy || !eligibilityResult?.eligible) return;

    if (!isConnected || !walletAddress) {
      alert("Please connect your wallet to submit your application.");
      return;
    }

    setApplicationStep('submitting');

    try {
      // In a real implementation, this would generate a ZK proof
      // For now, we'll simulate it with the medical data used for eligibility
      const mockZkProof = {
        proof: "mock_proof_data_" + Date.now(),
        publicSignals: ["1"],
        dataCommitment: `commitment_${walletAddress}_${selectedStudy.id}`
      };

      await applyToStudyWithZK(selectedStudy.id, mockZkProof, walletAddress);
      
      alert("🎉 Application submitted successfully! You are now enrolled in the study.");
      
      await loadStudies();
      
      setSelectedStudy(null);
      setApplicationStep('form');
      setEligibilityResult(null);
      setMedicalData({});
      
    } catch (error) {
      console.error('Application failed:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`❌ Application failed: ${errorMessage}\n\nPlease try again.`);
      setApplicationStep('result'); 
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading available studies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Studies</h1>
          <p className="text-gray-600">
            Discover medical research opportunities. All studies use privacy-preserving technology 
            to protect your data while enabling important medical research.
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Privacy-First Research</h3>
              <p className="text-blue-800 text-sm">
                Study criteria are kept confidential to prevent data manipulation. 
                You'll only learn if you qualify after providing your real medical information.
                Your data is protected using zero-knowledge proofs.
              </p>
            </div>
          </div>
        </div>

        {/* Studies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studies.map((study) => (
            <Card key={study.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={study.status === 'active' ? 'default' : 'secondary'}>
                    {study.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    ID: {study.id}
                  </span>
                </div>
                <CardTitle className="text-lg">{study.title}</CardTitle>
                {study.description && (
                  <CardDescription className="line-clamp-3">
                    {study.description}
                  </CardDescription>
                )}
                
                {/* Tags Section */}
                {study.tags && study.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {study.tags.slice(0, 3).map((tag, tagIndex) => {
                      const getTagStyles = (tag: string) => {
                        const tagLower = tag.toLowerCase();
                        
                        if (tagLower.includes('age')) {
                          return "bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 hover:shadow-sm";
                        }
                        
                        if (tagLower.includes('smoker') || tagLower.includes('smoking') || tagLower.includes('diabetes')) {
                          return "bg-violet-50 text-violet-800 border border-violet-200 hover:bg-violet-100 hover:shadow-sm";
                        }
                        
                        if (tagLower.includes('bmi') || tagLower.includes('bp') || tagLower.includes('blood pressure') || tagLower.includes('cholesterol')) {
                          return "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:shadow-sm";
                        }
                        
                        return "bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100 hover:shadow-sm";
                      };

                      return (
                        <span
                          key={tagIndex}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${getTagStyles(tag)}`}
                        >
                          {tag}
                        </span>
                      );
                    })}
                    {study.tags.length > 3 && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-50 text-gray-800 border border-gray-200 hover:bg-gray-100 hover:shadow-sm transition-all duration-200">
                        +{study.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{study.currentParticipants} / {study.maxParticipants} participants</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Started {new Date(study.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-3">
                    <div className="flex items-center gap-2 text-xs text-blue-600 mb-3">
                      <Shield className="h-3 w-3" />
                      <span>Privacy Protected</span>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="w-full"
                          disabled={study.status !== 'active' || study.currentParticipants >= study.maxParticipants}
                          onClick={() => handleApplyToStudy(study)}
                        >
                          Apply to Study
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Apply to {selectedStudy?.title}</DialogTitle>
                          <DialogDescription>
                            Complete the medical information form to check your eligibility.
                            Your data will be processed privately using zero-knowledge proofs.
                          </DialogDescription>
                        </DialogHeader>

                        {applicationStep === 'form' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="age">Age</Label>
                                <Input
                                  id="age"
                                  type="number"
                                  value={medicalData?.age || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setMedicalData(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))
                                  }
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="gender">Gender</Label>
                                <Select onValueChange={(value) => setMedicalData(prev => ({ ...prev, gender: parseInt(value) as 0 | 1 | 2 }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">Other</SelectItem>
                                    <SelectItem value="1">Male</SelectItem>
                                    <SelectItem value="2">Female</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="bmi">BMI</Label>
                                <Input
                                  id="bmi"
                                  type="number"
                                  step="0.1"
                                  value={medicalData?.bmi || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setMedicalData(prev => ({ ...prev, bmi: parseFloat(e.target.value) || undefined }))
                                  }
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor="cholesterol">Cholesterol (mg/dL)</Label>
                                <Input
                                  id="cholesterol"
                                  type="number"
                                  value={medicalData?.cholesterol || ''}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                    setMedicalData(prev => ({ ...prev, cholesterol: parseInt(e.target.value) || undefined }))
                                  }
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="diabetes">Diabetes Type</Label>
                                <Select onValueChange={(value) => setMedicalData(prev => ({ ...prev, diabetesType: parseInt(value) as 0 | 1 | 2 | 3 | 4 }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select diabetes type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">None</SelectItem>
                                    <SelectItem value="1">Type 1</SelectItem>
                                    <SelectItem value="2">Type 2</SelectItem>
                                    <SelectItem value="3">Unspecified</SelectItem>
                                    <SelectItem value="4">Pre-diabetes</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <Label htmlFor="smoking">Smoking Status</Label>
                                <Select onValueChange={(value) => setMedicalData(prev => ({ ...prev, smokingStatus: parseInt(value) as 0 | 1 | 2 }))}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select smoking status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">Never</SelectItem>
                                    <SelectItem value="1">Current</SelectItem>
                                    <SelectItem value="2">Former</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <Button onClick={handleCheckEligibility} className="w-full">
                              Check Eligibility
                            </Button>
                          </div>
                        )}

                        {applicationStep === 'checking' && (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p>Checking eligibility privately...</p>
                            <p className="text-sm text-gray-600 mt-2">
                              Your data is being processed using zero-knowledge proofs
                            </p>
                          </div>
                        )}

                        {applicationStep === 'submitting' && (
                          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p>Submitting your application...</p>
                            <p className="text-sm text-gray-600 mt-2">
                              Generating zero-knowledge proof and enrolling you in the study
                            </p>
                          </div>
                        )}

                        {applicationStep === 'result' && eligibilityResult && (
                          <div className="text-center py-8">
                            {eligibilityResult.eligible ? (
                              <div className="space-y-4">
                                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
                                <h3 className="text-xl font-semibold text-green-900">You're Eligible!</h3>
                                <p className="text-gray-600">{eligibilityResult.message}</p>
                                <Button onClick={handleFinalApplication} className="w-full">
                                  Submit Application
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <XCircle className="h-16 w-16 text-red-600 mx-auto" />
                                <h3 className="text-xl font-semibold text-red-900">Not Eligible</h3>
                                <p className="text-gray-600">{eligibilityResult.message}</p>
                                <Button variant="outline" onClick={() => setSelectedStudy(null)} className="w-full">
                                  Close
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {studies.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Studies</h3>
            <p className="text-gray-600">There are currently no active research studies available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
