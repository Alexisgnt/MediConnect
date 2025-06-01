import React, { useState } from 'react';
import { Plus, Search, MoreVertical } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

const DoctorManagement: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-neutral-800">Doctor Management</h2>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Doctor
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5 text-neutral-400" />}
              className="max-w-md"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Patients
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">No doctors found</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button className="text-neutral-400 hover:text-neutral-500">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Doctor"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => setIsAddModalOpen(false)}>
              Add Doctor
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="First Name"
            placeholder="Enter first name"
            required
          />
          <Input
            label="Last Name"
            placeholder="Enter last name"
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="Enter email address"
            required
          />
          <Input
            label="Specialization"
            placeholder="Enter specialization"
            required
          />
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter phone number"
            required
          />
          <Input
            label="Address"
            placeholder="Enter practice address"
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default DoctorManagement;