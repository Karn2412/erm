import React, { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import toast from 'react-hot-toast';

interface ReimbursementProofModalProps {
  reimbursementId: string;   // 👈 which reimbursement we’re updating
  proofUrl: string;          // 👈 this will be the `receipt_url` (path in bucket)
  onClose: () => void;
  onActionComplete?: () => void; // refresh parent
}

const ReimbursementProofModal: React.FC<ReimbursementProofModalProps> = ({
  reimbursementId,
  proofUrl,
  onClose,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState<number | ''>('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // 🔑 Fetch signed/public URL for proof
  useEffect(() => {
    const getImageUrl = async () => {
      if (!proofUrl) return;

      // If bucket is PUBLIC:
      const { data } = supabase.storage
        .from('reimbursement') // 👈 your bucket name
        .getPublicUrl(proofUrl);
      setImageUrl(data.publicUrl);

      // If bucket is PRIVATE, instead use:
      // const { data, error } = await supabase.storage
      //   .from('reimbursements')
      //   .createSignedUrl(proofUrl, 60 * 60); // valid for 1 hr
      // if (error) console.error(error);
      // else setImageUrl(data.signedUrl);
    };

    getImageUrl();
  }, [proofUrl]);

  const handleUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (status === 'APPROVED') {
      if (!approvedAmount || approvedAmount <= 0) {
        toast.error('⚠️ Please enter a valid reimbursement amount');
        return;
      }
      const confirm = window.confirm(
        `Are you sure you want to approve this reimbursement for ₹${approvedAmount}?`
      );
      if (!confirm) return;
    } else {
      const confirm = window.confirm('Are you sure you want to reject this reimbursement?');
      if (!confirm) return;
    }

    setLoading(true);

    const { error } = await supabase
      .from('reimbursements')
      .update({
        status,
        approved_at: new Date().toISOString(),
        ...(status === 'APPROVED' && { approved_amount: approvedAmount }),
      })
      .eq('id', reimbursementId);

    setLoading(false);

    if (error) {
      console.error(`❌ Failed to ${status.toLowerCase()} reimbursement:`, error);
      toast.error('Error updating reimbursement');
    } else {
      toast.success(`✅ Reimbursement ${status.toLowerCase()} successfully`);
      if (onActionComplete) onActionComplete();
      onClose();
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-30 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-xl w-full max-w-3xl p-6 relative">
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 text-xl"
        >
          <FaTimes />
        </button>

        <h2 className="text-lg font-semibold mb-4">Reimbursement Proof</h2>

        {/* Proof Image */}
        <div className="bg-gray-200 rounded-lg h-72 mb-6 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="Proof" className="max-h-72 mx-auto" />
          ) : (
            <span className="text-gray-500 text-sm">Loading proof...</span>
          )}
        </div>

        {/* Input for Approved Amount */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Approved Amount (₹)</label>
          <input
            type="number"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(Number(e.target.value))}
            placeholder="Enter approved amount"
            className="border border-gray-300 rounded-md px-3 py-2 w-full"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleUpdate('APPROVED')}
            disabled={loading}
            className="bg-green-500 text-white text-xs px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => handleUpdate('REJECTED')}
            disabled={loading}
            className="bg-red-500 text-white text-xs px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReimbursementProofModal;
