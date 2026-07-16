import { Link } from 'react-router';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '../buttons/Button';
import { useCustomer } from '../../data/CustomerContext';

export function EnquiryEmptyState({ tabLabel }: { tabLabel: string }) {
  const customer = useCustomer();
  const firstName = customer.fullName.split(' ').slice(1, -1).join(' ') || customer.fullName;

  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-5">
        <FileText className="w-7 h-7 text-[rgb(154,38,214)]" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">No {tabLabel} yet</h2>
      <p className="text-sm text-gray-600 leading-relaxed mb-6">
        {firstName} is at assessment stage — a care plan hasn't been created yet.
        Review the recorded assessment in CareBridge to draft the plan and pre-fill this section.
      </p>
      <Link to={`/customers/${customer.id}/carebridge`}>
        <Button icon={<ArrowRight className="w-4 h-4" />}>Open CareBridge</Button>
      </Link>
    </div>
  );
}
