import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatTime, parseTime, generateTimeOptions } from "@/lib/utils/time";
import type { Schedule, WorkHours } from "@/lib/schemas/schedule";

interface WorkHoursSectionProps {
    workHours: Schedule["workHours"];
    onUpdate: (day: keyof Schedule["workHours"], workHours: WorkHours) => void;
}

const DAYS = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
] as const;

const TIME_OPTIONS = generateTimeOptions();

export function WorkHoursSection({
    workHours,
    onUpdate,
}: WorkHoursSectionProps) {
    return (
        <div className="space-y-6">
            {DAYS.map(({ key, label }) => (
                <div
                    key={key}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg bg-gray-50 gap-4 md:gap-0"
                >
                    <div className="flex items-center space-x-4">
                        <Switch
                            checked={workHours[key].isEnabled}
                            onCheckedChange={(checked) =>
                                onUpdate(key, {
                                    ...workHours[key],
                                    isEnabled: checked,
                                })
                            }
                        />
                        <Label className="text-lg font-medium">{label}</Label>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                        <Select
                            value={formatTime(
                                workHours[key].start.hour,
                                workHours[key].start.minute
                            )}
                            onValueChange={(value) => {
                                const { hour, minute } = parseTime(value);
                                onUpdate(key, {
                                    ...workHours[key],
                                    start: { hour, minute },
                                });
                            }}
                            disabled={!workHours[key].isEnabled}
                        >
                            <SelectTrigger className="w-full sm:w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                className="w-full sm:w-[140px] z-50 bg-white shadow-lg border border-gray-200"
                            >
                                <div className="max-h-[300px] overflow-y-auto">
                                    {TIME_OPTIONS.map((time) => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </div>
                            </SelectContent>
                        </Select>

                        <span className="text-gray-500 hidden sm:inline">
                            to
                        </span>
                        <span className="text-gray-500 sm:hidden">to</span>

                        <Select
                            value={formatTime(
                                workHours[key].end.hour,
                                workHours[key].end.minute
                            )}
                            onValueChange={(value) => {
                                const { hour, minute } = parseTime(value);
                                onUpdate(key, {
                                    ...workHours[key],
                                    end: { hour, minute },
                                });
                            }}
                            disabled={!workHours[key].isEnabled}
                        >
                            <SelectTrigger className="w-full sm:w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent
                                position="popper"
                                className="w-full sm:w-[140px] z-50 bg-white shadow-lg border border-gray-200"
                            >
                                <div className="max-h-[300px] overflow-y-auto">
                                    {TIME_OPTIONS.map((time) => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </div>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ))}
        </div>
    );
}
