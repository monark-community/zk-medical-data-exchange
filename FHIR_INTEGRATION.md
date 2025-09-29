# FHIR to ZK-SNARK Integration Guide

This guide explains how to integrate FHIR (Fast Healthcare Interoperability Resources) medical data with Zero-Knowledge proof generation for privacy-preserving medical research studies.

## Overview

The FHIR integration system allows medical institutions to:

1. Upload standard FHIR-formatted medical records
2. Automatically extract relevant criteria values
3. Check patient eligibility against study requirements
4. Generate ZK-SNARK proofs without revealing actual medical values

## Key Components

### 1. FHIR to ZK Mappings (`fhirToZkMappings.ts`)

Maps FHIR standard medical codes to numeric values used in ZK circuits:

- **Patient Demographics**: Gender, age calculation from birthDate, location from address
- **Observations**: Lab values (cholesterol, BMI, blood pressure, HbA1c), vital signs, smoking status
- **Conditions**: Diabetes types, cardiovascular conditions
- **Blood Type**: SNOMED CT codes and text representations

### 2. Integration Service (`fhirIntegrationService.ts`)

Provides complete workflow for processing FHIR data:

- **Validation**: Ensures FHIR compliance and required resource types
- **Extraction**: Pulls medical values from FHIR Bundle or individual resources
- **Eligibility**: Checks extracted data against study criteria
- **ZK Preparation**: Formats values for zero-knowledge proof generation

### 3. Example Usage (`examples/fhirIntegrationExample.ts`)

Demonstrates real-world usage patterns and provides sample FHIR data.

## Supported FHIR Resources

### Patient Resource

```json
{
  "resourceType": "Patient",
  "gender": "male|female|other|unknown",
  "birthDate": "YYYY-MM-DD",
  "address": [
    {
      "country": "US|CA|GB|...", // ISO country codes
      "state": "...",
      "city": "..."
    }
  ]
}
```

**Mapped to ZK Values**:

- `gender`: 1=male, 2=female, 0=other/unknown
- `age`: Calculated from birthDate
- `regions`: Country mapped to geographic regions (1-8)

### Observation Resource

#### Vital Signs & Lab Values

```json
{
  "resourceType": "Observation",
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "LOINC_CODE",
        "display": "Description"
      }
    ]
  },
  "valueQuantity": {
    "value": 180,
    "unit": "mg/dL"
  }
}
```

**Supported LOINC Codes**:

- `2085-9`: HDL Cholesterol
- `2089-1`: LDL Cholesterol
- `14647-2`: Total Cholesterol
- `39156-5`: Body Mass Index (BMI)
- `8480-6`: Systolic Blood Pressure
- `8462-4`: Diastolic Blood Pressure
- `4548-4`: HbA1c percentage
- `17856-6`: HbA1c (IFCC units)

#### Blood Type

```json
{
  "resourceType": "Observation",
  "code": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "SNOMED_CODE"
      }
    ]
  }
}
```

**SNOMED CT Blood Type Codes**:

- `278149003`: A+ → ZK value 1
- `278148006`: A- → ZK value 2
- `278152006`: B+ → ZK value 3
- `278151004`: B- → ZK value 4
- `278154007`: AB+ → ZK value 5
- `278153001`: AB- → ZK value 6
- `278155008`: O+ → ZK value 7
- `278156009`: O- → ZK value 8

#### Smoking Status

```json
{
  "resourceType": "Observation",
  "code": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "72166-2",
        "display": "Tobacco smoking status"
      }
    ]
  },
  "valueCodeableConcept": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "SMOKING_CODE"
      }
    ]
  }
}
```

**Smoking Status Codes**:

- `266919005`: Never smoked → ZK value 0
- `77176002`: Current smoker → ZK value 1
- `8517006`: Former smoker → ZK value 2

### Condition Resource

#### Diabetes

```json
{
  "resourceType": "Condition",
  "code": {
    "coding": [
      {
        "system": "http://hl7.org/fhir/sid/icd-10",
        "code": "E10|E11|E13|E14"
      }
    ]
  }
}
```

**ICD-10 Diabetes Codes**:

- `E10`: Type 1 diabetes → ZK value 1
- `E11`: Type 2 diabetes → ZK value 2
- `E13`: Other specified diabetes → ZK value 2
- `E14`: Unspecified diabetes → ZK value 3

#### Cardiovascular Disease

```json
{
  "resourceType": "Condition",
  "code": {
    "coding": [
      {
        "system": "http://hl7.org/fhir/sid/icd-10",
        "code": "I21|I22|I25|I50|I20|I42"
      }
    ]
  }
}
```

**ICD-10 Cardiovascular Codes**:

- `I21`, `I22`: Myocardial infarction → ZK value 1
- `I25`, `I50`, `I20`, `I42`: Chronic heart conditions → ZK value 2

## Usage Workflow

### 1. Basic Integration

```typescript
import { processFHIRForStudy, getFHIRProcessingSummary } from "./services/fhirIntegrationService";
import { StudyCriteria } from "@zk-medical/shared";

// Process uploaded FHIR data
const result = processFHIRForStudy(fhirBundle, studyCriteria);

// Check results
if (result.validation.isValid && result.eligibility?.isEligible) {
  // Patient is eligible, use ZK values for proof generation
  const zkValues = result.eligibility.zkReadyValues;
  console.log("Patient eligible with values:", zkValues);
} else {
  // Handle validation errors or ineligibility
  console.log("Issues:", result.validation.errors);
}
```

### 2. File Upload Handler

```typescript
const handleFHIRUpload = async (file: File, studyCriteria: StudyCriteria) => {
  try {
    const content = await file.text();
    const fhirData = JSON.parse(content);

    const result = processFHIRForStudy(fhirData, studyCriteria);

    return {
      eligible: result.eligibility?.isEligible || false,
      zkValues: result.eligibility?.zkReadyValues || {},
      summary: getFHIRProcessingSummary(result),
    };
  } catch (error) {
    return { eligible: false, zkValues: {}, summary: "Invalid FHIR file" };
  }
};
```

### 3. API Endpoint Integration

```typescript
// API Route: POST /api/studies/:studyId/check-eligibility
export async function POST(request: Request, { params }: { params: { studyId: string } }) {
  const fhirData = await request.json();

  // Fetch study criteria from database
  const studyCriteria = await getStudyCriteria(params.studyId);

  // Process FHIR data
  const result = processFHIRForStudy(fhirData, studyCriteria);

  return Response.json({
    studyId: params.studyId,
    eligible: result.eligibility?.isEligible || false,
    zkReadyValues: result.eligibility?.zkReadyValues || {},
    errors: result.validation.errors,
  });
}
```

## Regional Mappings

Patients are automatically mapped to geographic regions based on their address country:

1. **North America**: US, CA, MX
2. **Europe**: GB, DE, FR, IT, ES, NL, BE, AT, CH, SE, NO, DK, FI, PL, CZ, HU, IE, PT
3. **Asia**: CN, JP, KR, IN, TH, SG, MY, VN, PH, ID, BD, PK, LK, MM, KH, LA
4. **South America**: BR, AR, CL, PE, CO, VE, EC, UY, PY
5. **Africa**: ZA, NG, KE, ET, EG, MA, GH, TN, DZ
6. **Oceania**: AU, NZ, FJ, PG, NC, VU, SB
7. **Middle East**: SA, AE, IR, IQ, IL, JO, LB, SY, TR, KW, QA, BH, OM, YE
8. **Central America**: GT, BZ, SV, HN, NI, CR, PA

## Error Handling

The system provides detailed error reporting for:

- **Validation Errors**: Missing required fields, invalid FHIR structure
- **Eligibility Issues**: Specific criteria not met with actual vs required values
- **Missing Data**: Required medical values not found in FHIR resources

## Privacy & Security

- **Zero-Knowledge Proofs**: Actual medical values are never shared, only eligibility is proven
- **Local Processing**: FHIR data processing happens client-side before proof generation
- **No Data Storage**: Medical values are not persisted, only eligibility results
- **Standards Compliance**: Uses official FHIR R4, LOINC, SNOMED CT, and ICD-10 codes

## Testing

Use the provided example FHIR data in `examples/fhirIntegrationExample.ts`:

```typescript
import { demonstrateFHIRProcessing } from "./examples/fhirIntegrationExample";

// Run demonstration
demonstrateFHIRProcessing();
```

This will show the complete workflow from FHIR Bundle input to ZK-ready numeric values.

## Extension Points

To add support for new medical criteria:

1. **Add FHIR mappings** in `fhirToZkMappings.ts`
2. **Update extraction logic** in `extractZKValuesFromFHIR()`
3. **Add eligibility checks** in `checkStudyEligibility()`
4. **Update StudyCriteria interface** in shared library
5. **Add corresponding UI fields** in study creation form

The system is designed to be easily extensible for additional medical criteria while maintaining FHIR standards compliance.
