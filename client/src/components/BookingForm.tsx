import { useState } from "react";
import { BookingFormData } from "@shared/schema";
import PatientForm from "./PatientForm";
import TherapistSelection from "./TherapistSelection";
import DateTimeSelection from "./DateTimeSelection";
import AppointmentConfirmation from "./AppointmentConfirmation";
import StepNavigation from "./StepNavigation";

export default function BookingForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookingFormData>({});
  
  const totalSteps = 4;
  
  const updateFormData = (data: Partial<BookingFormData>) => {
    setFormData(prevData => ({ ...prevData, ...data }));
  };
  
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Form Header */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Réserver un rendez-vous</h2>
        <p className="mt-1 text-sm text-gray-500">Suivez les étapes pour planifier votre consultation</p>
      </div>

      {/* Stepper Navigation */}
      <div className="px-4 py-4 sm:px-6">
        <div className="flex justify-between items-center relative">
          {[
            { step: 1, label: "Patient" },
            { step: 2, label: "Thérapeute" },
            { step: 3, label: "Date" },
            { step: 4, label: "Confirmation" }
          ].map((item, index) => (
            <div 
              key={item.step}
              className={`stepper-item relative flex flex-col items-center ${currentStep >= item.step ? 'active' : ''}`}
              style={{
                position: 'relative',
                zIndex: 10
              }}
            >
              <div 
                className={`w-10 h-10 flex items-center justify-center rounded-full font-medium z-10 
                  ${currentStep >= item.step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                {item.step}
              </div>
              <div className="text-xs mt-2 font-medium">{item.label}</div>
              {index < 3 && (
                <div 
                  className={`absolute left-1/2 w-full h-0.5 top-5 -z-10 ${currentStep > item.step ? 'bg-primary' : 'bg-gray-200'}`}
                  style={{ width: '100%', left: '50%' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <div className="px-4 sm:px-6 py-6 bg-gray-50">
        {currentStep === 1 && (
          <PatientForm 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={nextStep} 
          />
        )}
        
        {currentStep === 2 && (
          <TherapistSelection 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}
        
        {currentStep === 3 && (
          <DateTimeSelection 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}
        
        {currentStep === 4 && (
          <AppointmentConfirmation 
            formData={formData} 
          />
        )}
      </div>
      
      {/* Navigation Buttons */}
      <StepNavigation 
        currentStep={currentStep}
        totalSteps={totalSteps}
        onPrevious={prevStep}
        onNext={nextStep}
        formData={formData}
      />
    </div>
  );
}
