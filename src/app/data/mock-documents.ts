export interface Document {
  id: string;
  status: 'success' | 'danger' | 'warning';
  title: string;
  subtitle?: string;
  createdDate: string;
  category: string;
}

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: '1',
    status: 'success',
    title: '28/11/2025',
    subtitle: '6 monthly Review of Customer Care',
    createdDate: '28/11/2025',
    category: 'Information Governance'
  },
  {
    id: '2',
    status: 'success',
    title: '15/11/2025',
    subtitle: '6 monthly Review of Customer Care',
    createdDate: '15/11/2025',
    category: 'Information Governance'
  },
  {
    id: '3',
    status: 'success',
    title: '4 Week Review of Care',
    subtitle: '4 Week Review of Care - DO NOT USE',
    createdDate: '22/10/2025',
    category: 'Other'
  },
  {
    id: '4',
    status: 'success',
    title: 'Good visit',
    subtitle: 'Positve Outcome form (win Form)',
    createdDate: '10/10/2025',
    category: 'Other'
  },
  {
    id: '5',
    status: 'success',
    title: '1st week - Visit review',
    subtitle: '1st week - telephone review',
    createdDate: '15/09/2025',
    category: 'Information Governance'
  },
  {
    id: '6',
    status: 'success',
    title: 'Covid-19 Risk assessment',
    createdDate: '03/09/2025',
    category: 'Infection Control'
  },
  {
    id: '7',
    status: 'success',
    title: 'Mask wearing checklist',
    createdDate: '15/07/2025',
    category: 'Infection Control'
  },
  {
    id: '8',
    status: 'success',
    title: 'Oral Health Risk Assessment',
    createdDate: '20/06/2025',
    category: 'Medication'
  },
  {
    id: '9',
    status: 'danger',
    title: 'Update / Communication form',
    createdDate: '10/03/2025',
    category: 'Information Governance'
  },
  {
    id: '10',
    status: 'warning',
    title: 'Care Plan Review',
    subtitle: 'Annual review pending approval',
    createdDate: '05/12/2025',
    category: 'Safe Guarding'
  }
];