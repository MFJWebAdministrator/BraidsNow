import { useState } from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatTime, parseTime, generateTimeOptions } from '@/lib/utils/time';
import type { Break } from '@/lib/schemas/schedule';

interface BreaksSectionProps {
  breaks: Break[];
  onAdd: (newBreak: Break) => void;
  onUpdate: (breakId: string, updatedBreak: Break) => void;
  onDelete: (breakId: string) => void;
}

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
] as const;

const TIME_OPTIONS = generateTimeOptions();

export function BreaksSection({ breaks, onAdd, onUpdate, onDelete }: BreaksSectionProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingBreak, setEditingBreak] = useState<Break | null>(null);
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('12:00 PM');
  const [endTime, setEndTime] = useState('1:00 PM');

  const handleOpenDialog = (breakToEdit?: Break) => {
    if (breakToEdit) {
      setEditingBreak(breakToEdit);
      setName(breakToEdit.name);
      setSelectedDays(breakToEdit.days);
      setStartTime(formatTime(breakToEdit.start.hour, breakToEdit.start.minute));
      setEndTime(formatTime(breakToEdit.end.hour, breakToEdit.end.minute));
    } else {
      setEditingBreak(null);
      setName('');
      setSelectedDays([]);
      setStartTime('12:00 PM');
      setEndTime('1:00 PM');
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    const start = parseTime(startTime);
    const end = parseTime(endTime);

    const breakData: Break = {
      id: editingBreak?.id || crypto.randomUUID(),
      name,
      days: selectedDays as Break['days'],
      start,
      end
    };

    if (editingBreak) {
      onUpdate(editingBreak.id, breakData);
    } else {
      onAdd(breakData);
    }

    setShowDialog(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => handleOpenDialog()} className="rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Break
          </Button>
        </div>

        <div className="grid gap-4">
          {breaks.map((breakItem) => (
            <Card key={breakItem.id} className="p-4 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{breakItem.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatTime(breakItem.start.hour, breakItem.start.minute)} - 
                    {formatTime(breakItem.end.hour, breakItem.end.minute)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {breakItem.days.map((day) => (
                      <span key={day} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(breakItem)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(breakItem.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-full w-full sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingBreak ? 'Edit Break' : 'Add Break'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Break Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lunch Break"
                className="w-full"
              />
            </div>

            <div>
              <Label>Days</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {DAYS.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedDays.includes(day.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDays([...selectedDays, day.value]);
                        } else {
                          setSelectedDays(selectedDays.filter(d => d !== day.value));
                        }
                      }}
                    />
                    <Label>{day.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="mt-2 w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-full sm:w-[140px] z-50 bg-white shadow-lg border border-gray-200">
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

              <div>
                <Label>End Time</Label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="mt-2 w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="w-full sm:w-[140px] z-50 bg-white shadow-lg border border-gray-200">
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

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingBreak ? 'Update' : 'Add'} Break
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}