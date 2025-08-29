import React, { useState } from 'react';

import AddEmployeeStepper from '../../components/adminEmployee/addemployee/AddEmployeeStepper';
import AddEmployeeForm from '../../components/adminEmployee/addemployee/AddEmployeeForm';
import SalaryDetails from '../../components/adminEmployee/addemployee/SalaryDetails';
import AssetAllocationForm from '../../components/adminEmployee/addemployee/AssetAllocationForm';
import PaymentInformationForm from '../../components/adminEmployee/addemployee/PaymentInformationForm';

const AddEmployeePage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Store IDs returned from Step 1
  const [employeeData, setEmployeeData] = useState({
    userId: '',
    companyId: '',
  });

  const handleEmployeeCreated = (userId: string, companyId: string) => {
    setEmployeeData({ userId, companyId });
    setCurrentStep(2); // Auto-advance to Salary Details
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AddEmployeeForm
            onEmployeeCreated={handleEmployeeCreated}
          />
        );

      case 2:
        return (
          <SalaryDetails
            userId={employeeData.userId}
            companyId={employeeData.companyId}
            onComplete={() => setCurrentStep(3)}   // ✅ move to Asset Allocation
          />
        );

      case 3:
        return (
          <AssetAllocationForm
            userId={employeeData.userId}
            companyId={employeeData.companyId}
            onComplete={() => setCurrentStep(4)}   // ✅ move to Payment Info
          />
        );

      case 4:
        return (
          <PaymentInformationForm
            userId={employeeData.userId}
            companyId={employeeData.companyId}
            onComplete={() => {
              alert('🎉 Employee fully added!');
              // optionally reset form:
              // setCurrentStep(1);
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 ">
      <div className="flex flex-col flex-1 w-full ">
        {/* Mobile header */}
        <div className="md:hidden flex justify-between items-center bg-white p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Add Employee</h2>
        </div>

        {/* Main Content */}
        <main className="p-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <AddEmployeeStepper
              onStepChange={(step) => setCurrentStep(step)}
              currentStep={currentStep}
            />

            {/* Dynamic Step Form */}
            <div className="bg-white p-5 rounded-2xl">{renderStep()}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddEmployeePage;
