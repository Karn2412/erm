import React, { useState } from 'react';

const BankingDetailsForm: React.FC<{ formData: any; setFormData: any }> = ({ formData, setFormData }) => {
  const pillInput =
    'w-full px-4 py-2 border-2 rounded-full focus:outline-none focus:border-blue-500';

  const [accountError, setAccountError] = useState('');

  const handleReEnterChange = (value: string) => {
    setFormData({ ...formData, reEnterAccountNumber: value });

    // Only validate if user typed something
    if (value && formData.accountNumber && value !== formData.accountNumber) {
      setAccountError('Account numbers do not match');
    } else {
      setAccountError('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl h-100">
      <form className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name as per Bank Records <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Full Name"
              className={`${pillInput} border-blue-400`}
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="XXXXXXXXXXX"
              className={`${pillInput} border-blue-400`}
              value={formData.accountNumber || ''}
              onChange={(e) =>
                setFormData({ ...formData, accountNumber: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Re-enter Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="XXXXXXXXXXX"
              className={`${pillInput} ${
                accountError ? 'border-red-500' : 'border-blue-400'
              }`}
              value={formData.reEnterAccountNumber || ''}
              onChange={(e) => handleReEnterChange(e.target.value)}
            />
            {accountError && (
              <p className="text-red-500 text-xs mt-1">{accountError}</p>
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IFSC Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="XXXXX"
              className={`${pillInput} border-blue-400`}
              value={formData.ifscCode || ''}
              onChange={(e) =>
                setFormData({ ...formData, ifscCode: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="XXXXXXXXXXX"
              className={`${pillInput} border-blue-400`}
              value={formData.bankName || ''}
              onChange={(e) =>
                setFormData({ ...formData, bankName: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="XXXXXXXXXXX"
              className={`${pillInput} border-blue-400`}
              value={formData.branchName || ''}
              onChange={(e) =>
                setFormData({ ...formData, branchName: e.target.value })
              }
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default BankingDetailsForm;
