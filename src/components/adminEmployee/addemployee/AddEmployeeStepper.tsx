import React from "react";

type StepStatus = "Completed" | "In Progress" | "Pending";

interface Step {
  number: number;
  label: string;
  status: StepStatus;
}

interface Props {
  currentStep: number;
  onStepChange: (step: number) => void;
}

const AddEmployeeStepper: React.FC<Props> = ({ currentStep, onStepChange }) => {
  const labels = ["Basic Details", "Salary Details", "Asset Allocation", "Payment Information"];

  const steps: Step[] = labels.map((label, index) => {
    const stepNumber = index + 1;

    let status: StepStatus = "Pending";
    if (stepNumber < currentStep) status = "Completed";
    else if (stepNumber === currentStep) status = "In Progress";

    return { number: stepNumber, label, status };
  });

  const getStepStyles = (status: StepStatus) => {
    switch (status) {
      case "Completed":
        return {
          circle: "bg-green-500 text-white",
          line: "bg-green-500",
          statusChip: "bg-green-100 text-green-600",
        };
      case "In Progress":
        return {
          circle: "bg-blue-500 text-white",
          line: "bg-blue-500",
          statusChip: "bg-blue-100 text-blue-600",
        };
      case "Pending":
      default:
        return {
          circle: "bg-gray-300 text-gray-600",
          line: "bg-gray-300",
          statusChip: "bg-gray-100 text-gray-400",
        };
    }
  };

  return (
    <div className="bg-white p-6 rounded-md">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Add Employee</h1>
        <div className="text-sm text-gray-500 mt-1">{steps[currentStep - 1].label}</div>
      </div>

      {/* Stepper */}
      <div className="flex items-center">
        {steps.map((step, index) => {
          const styles = getStepStyles(step.status);
          const isLast = index === steps.length - 1;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step */}
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => onStepChange(step.number)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${styles.circle}`}
                >
                  {step.number}
                </div>
                <div className="text-sm mt-2 text-gray-800 font-medium">
                  {step.label}
                </div>
                <div
                  className={`mt-1 px-2 py-0.5 text-xs rounded-md font-medium ${styles.statusChip}`}
                >
                  {step.status}
                </div>
              </div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`flex-1 mb-10 h-0.5 ${
                    step.number < currentStep ? styles.line : "bg-gray-300"
                  } mx-2`}
                ></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AddEmployeeStepper;
