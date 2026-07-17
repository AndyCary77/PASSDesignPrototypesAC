import { Inbox } from 'lucide-react';
import { useCustomer } from '../../data/CustomerContext';

export function TabEmptyState({ label }: { label: string }) {
  const customer = useCustomer();
  const firstName = customer.fullName.split(' ').slice(1, -1).join(' ') || customer.fullName;

  return (
    <div className="max-w-md mx-auto mt-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
        <Inbox className="w-7 h-7 text-gray-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">No {label} yet</h2>
      <p className="text-sm text-gray-600 leading-relaxed">Nothing has been added for {firstName} yet.</p>
    </div>
  );
}
