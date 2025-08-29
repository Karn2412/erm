// src/components/personaldetails/SectionStepper.tsx
import React from 'react';

type StepStatus = 'Completed' | 'In Progress' | 'Pending';

interface Step {
  number: number;
  label: string;
  status: StepStatus;
}

interface Props {
  currentSection: number;
  onSectionChange: (section: number) => void;
}

const SectionStepper: React.FC<Props> = ({
  currentSection,
  onSectionChange,
}) => {
  // define steps with dynamic status
  const steps: Step[] = [
    {
      number: 1,
      label: 'Basic Details',
      status:
        currentSection > 1
          ? 'Completed'
          : currentSection === 1
            ? 'In Progress'
            : 'Pending',
    },
    {
      number: 2,
      label: 'Banking Details',
      status:
        currentSection > 2
          ? 'Completed'
          : currentSection === 2
            ? 'In Progress'
            : 'Pending',
    },
    {
      number: 3,
      label: 'Document Upload',
      status:
        currentSection === 3
          ? 'In Progress'
          : currentSection > 3
            ? 'Completed'
            : 'Pending',
    },
  ];

  // circle background & text color
  const circleClasses = (status: StepStatus) => {
    if (status === 'Completed') return 'bg-green-500 border-green-500  text-white';
    if (status === 'In Progress') return 'bg-blue-500 border-blue-500 text-white';
    return 'bg-gray-200 border-gray-200 text-gray-500';
  };

  // connector line color
  const lineClasses = (idx: number) =>
    idx < currentSection - 1 ? 'bg-green-500' : 'bg-gray-200';

  return (
    <div className="bg-white p-6 rounded-2xl  mb-5">
      {/* Header */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Personal Details</h2>
      <p className="text-sm text-gray-600 mb-6">
        {steps[currentSection - 1].label}
      </p>

      {/* Stepper */}
      <div className="flex items-center">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          return (
            <div key={step.number} className="flex-1 flex items-center">
              <div
                className="flex flex-col items-center cursor-pointer z-10"
                onClick={() => onSectionChange(step.number)}
              >
                <div
                  className={`w-10 h-10 rounded-full border-2 flex  items-center justify-center font-medium ${circleClasses(
                    step.status
                  )}`}
                >
                  {step.number}
                </div>
                <div className="flex flex-col items-start text-left mt-2">
                  <span className="text-sm text-gray-700">{step.label}</span>
                  <span
                    className={`text-xs mt-1 px-2 py-1 rounded-lg ${step.status === "Completed"
                        ? "text-green-500 bg-green-50"
                        : step.status === "In Progress"
                          ? "text-blue-600 bg-gray-50"
                          : "text-gray-500 bg-gray-50"
                      }`}
                  >
                    {step.status}
                  </span>
                </div>
              </div>

              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mb-10  self-center -ml-1 ${lineClasses(idx)}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SectionStepper;

