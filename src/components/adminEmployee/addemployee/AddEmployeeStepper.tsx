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
          circle: "bg-green-500 border-green-500 text-white",
          text: "text-gray-900",
          statusText: "text-green-600",
          line: "bg-green-500",
        };
      case "In Progress":
        return {
          circle: "bg-blue-500 border-blue-500 text-white",
          text: "text-gray-900",
          statusText: "text-blue-600",
          line: "bg-blue-500",
        };
      case "Pending":
      default:
        return {
          circle: "bg-gray-300 border-gray-300 text-gray-600",
          text: "text-gray-500",
          statusText: "text-gray-500",
          line: "bg-gray-300",
        };
    }
  };

  return (
    <div className="bg-white p-6 rounded-md">
      {/* Heading */}
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
              {/* Step Circle and Text */}
              <div
                className="flex flex-col items-center cursor-pointer"
                onClick={() => onStepChange(step.number)}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${styles.circle}`}
                >
                  {step.number}
                </div>
                <div className={`text-xs mt-1 ${styles.text}`}>{step.label}</div>
                <div className={`text-xs ${styles.statusText}`}>{step.status}</div>
              </div>

              {/* Line */}
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 ${
                    step.number < currentStep ? styles.line : "bg-gray-300"
                  } self-center -mt-8`}
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
