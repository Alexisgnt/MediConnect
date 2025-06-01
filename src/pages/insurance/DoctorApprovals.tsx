import React from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const DoctorApprovals: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-neutral-800">Doctor Approvals</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-neutral-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-neutral-700">8</p>
              <p className="text-sm text-neutral-600">Pending Approvals</p>
            </div>
            <Clock className="h-10 w-10 text-neutral-500" />
          </div>
        </Card>

        <Card className="bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-green-700">24</p>
              <p className="text-sm text-green-600">Approved Doctors</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </Card>

        <Card className="bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-red-700">3</p>
              <p className="text-sm text-red-600">Rejected Applications</p>
            </div>
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-neutral-800">Pending Applications</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">No pending applications</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">-</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" disabled>
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" disabled>
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DoctorApprovals;