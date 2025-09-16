import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import AddEmployeeStepper from "../../components/adminEmployee/addemployee/AddEmployeeStepper";
import AddEmployeeForm from "../../components/adminEmployee/addemployee/AddEmployeeForm";
import SalaryDetails from "../../components/adminEmployee/addemployee/SalaryDetails";
import AssetAllocationForm from "../../components/adminEmployee/addemployee/AssetAllocationForm";
import PaymentInformationForm from "../../components/adminEmployee/addemployee/PaymentInformationForm";

const AddEmployeePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [dateOfJoining, setDateOfJoining] = useState<string>("");
  const navigate = useNavigate();

  const [employeeData, setEmployeeData] = useState({
    userId: "",
    companyId: "",
  });

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }
  };

  const handleEmployeeCreated = (userId: string, companyId: string, doj: string) => {
    setEmployeeData({ userId, companyId });
    setDateOfJoining(doj); // ✅ store DOJ in parent
    markStepComplete(1);
    setCurrentStep(2);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <AddEmployeeForm onEmployeeCreated={handleEmployeeCreated} 
        />;

      case 2:
        return (
          <SalaryDetails
            userId={employeeData.userId}
            companyId={employeeData.companyId}
            dateOfJoining={dateOfJoining}
            onComplete={() => {
              markStepComplete(2);
              setCurrentStep(3);
              setDateOfJoining(dateOfJoining); // ✅ ensure DOJ is set
            }}
          />
        );

      case 3:
        return (
          <AssetAllocationForm
            userId={employeeData.userId}
            companyId={employeeData.companyId}
            onComplete={() => {
              markStepComplete(3);
              setCurrentStep(4);
            }}
          />
        );

      case 4:
        return (
          <PaymentInformationForm
            userId={employeeData.userId}
            companyId={employeeData.companyId}
            onComplete={() => {
              markStepComplete(4);
              alert("🎉 Employee fully added!");
              navigate("/employees"); // force exit only after completion
            }}
          />
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && completedSteps.includes(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex flex-col flex-1 w-full">
        {/* Top Header with Back Button (only in Step 1) */}
        {currentStep === 1 && (
          <div className="flex items-center bg-gray-50 p-4">
            <button
              onClick={() => navigate("/employees")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="p-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <AddEmployeeStepper
              currentStep={currentStep}
              // 🔒 remove free navigation
              onStepChange={() => {}}
              // disabledSteps={completedSteps}
            />

            <div className="bg-white p-5 rounded-2xl">{renderStep()}</div>

            {/* Back/Next Buttons */}
            <div className="flex justify-between mt-6">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentStep === 1
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                }`}
              >
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!completedSteps.includes(currentStep)}
                  className={`px-4 py-2 rounded-lg ${
                    completedSteps.includes(currentStep)
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (completedSteps.includes(4)) {
                      alert("🎉 Employee fully added!");
                      navigate("/employees");
                    }
                  }}
                  disabled={!completedSteps.includes(4)}
                  className={`px-4 py-2 rounded-lg ${
                    completedSteps.includes(4)
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Finish
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddEmployeePage;
