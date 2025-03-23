import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface MultipleTimeSlotsOptionsProps {
  isMultipleTimeSlots: boolean;
  selectedTimeSlots: Array<{date: string, time: string}>;
  onMultipleTimeSlotsChange: (value: boolean) => void;
  onRemoveTimeSlot?: (index: number) => void;
}

export default function MultipleTimeSlotsOptions({
  isMultipleTimeSlots,
  selectedTimeSlots,
  onMultipleTimeSlotsChange,
  onRemoveTimeSlot,
}: MultipleTimeSlotsOptionsProps) {
  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex items-center mb-4">
        <Checkbox 
          id="multipleTimeSlotsOption" 
          checked={isMultipleTimeSlots}
          onCheckedChange={(checked) => onMultipleTimeSlotsChange(checked as boolean)}
          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
        />
        <Label
          htmlFor="multipleTimeSlotsOption"
          className="ml-2 block text-sm text-gray-900"
        >
          Réserver plusieurs créneaux horaires
        </Label>
      </div>
      
      {isMultipleTimeSlots && selectedTimeSlots.length > 0 && (
        <div className="pl-6 mt-2">
          <div className="bg-gray-50 p-4 rounded-md">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Créneaux sélectionnés</h5>
            {onRemoveTimeSlot && (
              <p className="text-xs text-gray-500 mb-3">
                Cliquez sur le bouton "X" pour supprimer un créneau incorrectement sélectionné
              </p>
            )}
            <ul className="mt-2 text-sm text-gray-500 space-y-2">
              {selectedTimeSlots.map((slot, index) => (
                <li key={index} className="flex items-center justify-between bg-white p-2 rounded border border-gray-200">
                  <div className="flex items-center">
                    <span className="material-icons text-xs mr-2 text-primary">schedule</span>
                    <span className="font-medium">{slot.date} à {slot.time}</span>
                  </div>
                  {onRemoveTimeSlot && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
                      onClick={() => onRemoveTimeSlot(index)}
                      title="Supprimer ce créneau"
                    >
                      <X className="h-4 w-4 text-gray-500" />
                      <span className="sr-only">Supprimer</span>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}