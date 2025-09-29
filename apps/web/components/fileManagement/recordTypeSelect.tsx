import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FhirResourceType, FhirResourceTypes } from "@/constants/fhirResourceTypes";

export default function RecordTypeSelect({
  onValueChange,
  selectedValue,
}: {
  // eslint-disable-next-line no-unused-vars
  onValueChange: (value: FhirResourceTypes) => void;
  selectedValue: FhirResourceTypes;
}) {
  const recordTypeOptions = Object.values(FhirResourceType);
  return (
    <Select onValueChange={onValueChange} value={selectedValue}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select record type" />
      </SelectTrigger>
      <SelectContent>
        {recordTypeOptions.map((type) => (
          <SelectItem key={type} value={type}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
