import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecordType, RecordTypes } from "@/constants/recordTypes";

export default function RecordTypeSelect({
  onValueChange,
  selectedValue,
}: {
  // eslint-disable-next-line no-unused-vars
  onValueChange: (value: RecordTypes) => void;
  selectedValue: RecordTypes;
}) {
  const recordTypeOptions = Object.values(RecordType);
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
