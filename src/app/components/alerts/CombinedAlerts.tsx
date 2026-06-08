import React from 'react';
import { Clock, User, Calendar, MapPin, Phone, FastForward, Rewind, Heart, Coffee, House, AlarmClock, Package, Moon, Eye, Activity, ShoppingBag, Users, ClipboardCheck } from 'lucide-react';

// Custom SVG Alert Icon (Conflict)
const CustomAlertIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24px" height="24px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
    <g stroke="none" fill="none" fillRule="evenodd">
      <g>
        <polygon points="0 0 24 0 24 24 0 24"></polygon>
        <path d="M10.366447,4.91222128 C11.0935197,3.65636839 12.9064803,3.65636839 13.633553,4.91222128 L20.7437577,17.1969175 C21.4708304,18.4527704 20.5643501,20.0296684 19.1102047,20.0296684 L4.88979533,20.0296684 C3.43564989,20.0296684 2.52916961,18.4527704 3.25624234,17.1969175 Z M12,15.3084169 C11.478505,15.3084169 11.0557497,15.7311722 11.0557497,16.2526672 C11.0557497,16.7741623 11.478505,17.1969175 12,17.1969175 C12.521495,17.1969175 12.9442503,16.7741623 12.9442503,16.2526672 C12.9442503,15.7311722 12.521495,15.3084169 12,15.3084169 Z M12,7.75441464 C11.478505,7.75441464 11.0557497,8.1771699 11.0557497,8.69866493 L11.0557497,12.4756661 C11.0557497,12.9971611 11.478505,13.4199164 12,13.4199164 C12.521495,13.4199164 12.9442503,12.9971611 12.9442503,12.4756661 L12.9442503,8.69866493 C12.9442503,8.1771699 12.521495,7.75441464 12,7.75441464 Z" fill="currentColor"></path>
      </g>
    </g>
  </svg>
);

// Custom SVG Run Icon
const RunIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="25" height="25" viewBox="0 0 25 25" xmlns="http://www.w3.org/2000/svg">
    <g fill="none" fillRule="evenodd">
      <path d="M.5.846h24v24H.5z"></path>
      <path d="M18.032 3.25c2.372 0 4.278 1.923 4.278 4.311 0 1.289-.426 2.221-1.488 3.513l-.149.178-.465.542c-.55.643-.984 1.189-1.385 1.76l-.15.215-.12.195a.61.61 0 0 1-1.033.004l-.074-.113-.056-.085a21.124 21.124 0 0 0-1.317-1.719l-.224-.264-.473-.552-.237-.286-.21-.265a6.783 6.783 0 0 1-.686-1.063 4.378 4.378 0 0 1-.493-2.06c0-2.388 1.908-4.311 4.282-4.311zm0 1.223a3.064 3.064 0 0 0-3.06 3.088c0 .554.114 1.022.36 1.503.118.23.258.456.442.708l.116.154.192.244.221.269.475.552a26.8 26.8 0 0 1 1.15 1.427l.103.141.057-.077c.294-.399.616-.803.997-1.255l.196-.23.458-.534c1.035-1.226 1.348-1.918 1.348-2.902 0-1.716-1.361-3.088-3.055-3.088zm-.002 2.14a.92.92 0 0 1 .917.917.92.92 0 0 1-.917.917.92.92 0 0 1-.917-.917.92.92 0 0 1 .917-.917z" stroke="#737373" strokeWidth="0.5" fill="#737373" fillRule="nonzero"></path>
      <path d="M17.78 15.25a.75.75 0 0 1 .102 1.493l-.102.007h-7.55a.774.774 0 0 0-.105 1.542l.105.007h9.666a2.377 2.377 0 0 1 .163 4.749l-.163.005H6.25a.75.75 0 0 1-.102-1.493l.102-.007h13.646a.877.877 0 0 0 .11-1.747l-.11-.007H10.23a2.274 2.274 0 0 1-.156-4.544l.156-.005h7.55zM3.663 21.553a.75.75 0 0 1 .102 1.493l-.102.007h-.32a.75.75 0 0 1-.103-1.493l.102-.007h.32z" fill="#737373" fillRule="nonzero"></path>
    </g>
  </svg>
);

// Tab Button Component
const TabButton = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 font-medium transition-colors border-b-2 ${
      isActive 
        ? 'border-[rgb(154,38,214)] text-[rgb(154,38,214)]' 
        : 'border-transparent text-gray-600 hover:text-gray-900'
    }`}
  >
    {label}
  </button>
);

// Care Type Tag Component
const CareTypeTag = ({ type }: { type: 'personal-care' | 'companionship' | 'live-in' | 'sleeping-night' | 'waking-night' | 'complex-care' | 'shopping' | 'couple' | 'custom' }) => {
  const configs = {
    'personal-care': {
      label: 'personal care',
      bgColor: 'rgba(59, 130, 246, 0.082)',
      textColor: 'rgb(29, 78, 216)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      Icon: Heart,
    },
    'companionship': {
      label: 'companionship',
      bgColor: 'rgba(249, 115, 22, 0.082)',
      textColor: 'rgb(154, 52, 18)',
      borderColor: 'rgba(249, 115, 22, 0.2)',
      Icon: Coffee,
    },
    'live-in': {
      label: 'live-in',
      bgColor: 'rgba(99, 102, 241, 0.082)',
      textColor: 'rgb(55, 48, 163)',
      borderColor: 'rgba(99, 102, 241, 0.2)',
      Icon: House,
    },
    'sleeping-night': {
      label: 'sleeping night',
      bgColor: 'rgba(71, 85, 105, 0.082)',
      textColor: 'rgb(30, 41, 59)',
      borderColor: 'rgba(71, 85, 105, 0.2)',
      Icon: Moon,
    },
    'waking-night': {
      label: 'waking night',
      bgColor: 'rgba(14, 165, 233, 0.082)',
      textColor: 'rgb(7, 89, 133)',
      borderColor: 'rgba(14, 165, 233, 0.2)',
      Icon: Eye,
    },
    'complex-care': {
      label: 'complex care',
      bgColor: 'rgba(244, 63, 94, 0.082)',
      textColor: 'rgb(159, 18, 57)',
      borderColor: 'rgba(244, 63, 94, 0.2)',
      Icon: Activity,
    },
    'shopping': {
      label: 'shopping',
      bgColor: 'rgba(16, 185, 129, 0.082)',
      textColor: 'rgb(4, 120, 87)',
      borderColor: 'rgba(16, 185, 129, 0.2)',
      Icon: ShoppingBag,
    },
    'couple': {
      label: 'couple',
      bgColor: 'rgba(217, 70, 239, 0.082)',
      textColor: 'rgb(134, 25, 143)',
      borderColor: 'rgba(217, 70, 239, 0.2)',
      Icon: Users,
    },
    'custom': {
      label: 'custom care',
      bgColor: 'rgba(107, 114, 128, 0.082)',
      textColor: 'rgb(55, 65, 81)',
      borderColor: 'rgba(107, 114, 128, 0.2)',
      Icon: ClipboardCheck,
    },
  };

  const config = configs[type];
  const Icon = config.Icon;

  return (
    <span 
      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-medium capitalize whitespace-nowrap leading-[1.4] align-middle [&_svg]:!w-3 [&_svg]:!h-3 [&_svg]:!text-current"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Area Tag Component
const AreaTag = ({ area }: { area: 'area-1' | 'area-2' | 'area-3' | 'area-4' | 'area-5' | 'area-6' | 'area-7' | 'area-8' | 'area-9' | 'area-10' | 'area-11' | 'area-12' }) => {
  const configs = {
    'area-1': {
      label: 'Area 1',
      bgColor: 'rgba(147, 51, 234, 0.082)',
      textColor: 'rgb(76, 27, 122)',
      borderColor: 'rgba(147, 51, 234, 0.25)',
    },
    'area-2': {
      label: 'Area 2',
      bgColor: 'rgba(22, 163, 74, 0.082)',
      textColor: 'rgb(11, 85, 38)',
      borderColor: 'rgba(22, 163, 74, 0.25)',
    },
    'area-3': {
      label: 'Area 3',
      bgColor: 'rgba(202, 138, 4, 0.082)',
      textColor: 'rgb(105, 72, 2)',
      borderColor: 'rgba(202, 138, 4, 0.25)',
    },
    'area-4': {
      label: 'Area 4',
      bgColor: 'rgba(37, 99, 235, 0.082)',
      textColor: 'rgb(19, 51, 122)',
      borderColor: 'rgba(37, 99, 235, 0.25)',
    },
    'area-5': {
      label: 'Area 5',
      bgColor: 'rgba(236, 72, 153, 0.082)',
      textColor: 'rgb(112, 26, 72)',
      borderColor: 'rgba(236, 72, 153, 0.25)',
    },
    'area-6': {
      label: 'Area 6',
      bgColor: 'rgba(249, 115, 22, 0.082)',
      textColor: 'rgb(124, 45, 18)',
      borderColor: 'rgba(249, 115, 22, 0.25)',
    },
    'area-7': {
      label: 'Area 7',
      bgColor: 'rgba(20, 184, 166, 0.082)',
      textColor: 'rgb(13, 94, 85)',
      borderColor: 'rgba(20, 184, 166, 0.25)',
    },
    'area-8': {
      label: 'Area 8',
      bgColor: 'rgba(239, 68, 68, 0.082)',
      textColor: 'rgb(127, 29, 29)',
      borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    'area-9': {
      label: 'Area 9',
      bgColor: 'rgba(99, 102, 241, 0.082)',
      textColor: 'rgb(49, 46, 129)',
      borderColor: 'rgba(99, 102, 241, 0.25)',
    },
    'area-10': {
      label: 'Area 10',
      bgColor: 'rgba(168, 85, 247, 0.082)',
      textColor: 'rgb(88, 28, 135)',
      borderColor: 'rgba(168, 85, 247, 0.25)',
    },
    'area-11': {
      label: 'Area 11',
      bgColor: 'rgba(132, 204, 22, 0.082)',
      textColor: 'rgb(54, 83, 20)',
      borderColor: 'rgba(132, 204, 22, 0.25)',
    },
    'area-12': {
      label: 'Area 12',
      bgColor: 'rgba(6, 182, 212, 0.082)',
      textColor: 'rgb(14, 116, 144)',
      borderColor: 'rgba(6, 182, 212, 0.25)',
    },
  };

  const config = configs[area];

  return (
    <span 
      className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-sm font-medium capitalize whitespace-nowrap leading-[1.4] align-middle [&_svg]:!w-3 [&_svg]:!h-3 [&_svg]:!text-current"
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <MapPin className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Visit Card Component
interface VisitCardProps {
  initials: string;
  avatarColor: string;
  visitType: string;
  clientName: string;
  time: string;
  frequency: string;
  date: string;
  address: string;
  phone?: string;
  timeCritical?: boolean;
  adjustedTime?: string;
  planTime?: string;
  assignedCount: string;
  assignedEmployees: { name: string }[];
  conflictMessage?: string;
  maxWidth?: string;
  variant?: 'default' | 'aligned';
  careType?: 'personal-care' | 'companionship' | 'live-in' | 'sleeping-night' | 'waking-night' | 'complex-care' | 'shopping' | 'couple' | 'custom';
  area?: 'area-1' | 'area-2' | 'area-3' | 'area-4' | 'area-5' | 'area-6' | 'area-7' | 'area-8' | 'area-9' | 'area-10' | 'area-11' | 'area-12';
}

const VisitCard = ({
  initials,
  avatarColor,
  visitType,
  clientName,
  time,
  frequency,
  date,
  address,
  phone,
  timeCritical,
  adjustedTime,
  planTime,
  assignedCount,
  assignedEmployees,
  conflictMessage,
  maxWidth = "max-w-[480px]",
  variant = 'default',
  careType = 'personal-care',
  area = 'area-1',
}: VisitCardProps) => {
  // Helper function to compare times
  const isTimeLater = (adjusted: string, plan: string) => {
    const parseTime = (timeRange: string) => {
      const startTime = timeRange.split('-')[0].trim();
      const [hours, minutes] = startTime.split(':').map(Number);
      return hours * 60 + minutes;
    };
    return parseTime(adjusted) > parseTime(plan);
  };

  const timeIsLater = adjustedTime && planTime ? isTimeLater(adjustedTime, planTime) : false;

  if (variant === 'aligned') {
    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-300 p-6 min-w-[280px] ${maxWidth}`}>
        {/* Header Section - Avatar and Title Aligned */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex gap-3 items-center">
            {/* Avatar */}
            <div
              className="w-[60px] h-[60px] rounded-full flex items-center justify-center flex-shrink-0 text-[24px] font-bold text-gray-900"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>

            {/* Visit Title and Care Type Tag */}
            <div className="flex flex-col gap-1">
              <h3 className="text-[18px] leading-tight">
                <span className="font-semibold">{visitType}{visitType === 'Day Sit' ? '' : ' Visit'}</span>
                <span className="font-normal"> with </span>
                <span className="font-semibold">{clientName}</span>
              </h3>
              
              {/* Tags Row */}
              <div className="flex items-center gap-2 self-start">
                {/* Care Type Tag */}
                {careType && <CareTypeTag type={careType} />}
                
                {/* Area Tag */}
                {area && <AreaTag area={area} />}
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="pt-4">
          {/* Time Display */}
          {adjustedTime ? (
            <div className="mb-1">
              <div className="flex items-start gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
                <span className="text-[14px] leading-normal">Adjusted time</span>
                {timeIsLater ? (
                  <FastForward className="w-4 h-4 text-amber-500 flex-shrink-0 mt-[4px]" />
                ) : (
                  <Rewind className="w-4 h-4 text-amber-500 flex-shrink-0 mt-[4px]" />
                )}
                <span className="text-[14px] leading-normal font-semibold text-amber-500">{adjustedTime}, {frequency}</span>
              </div>
              <div className="flex items-start gap-2 text-[14px] leading-normal text-gray-500 ml-5">
                Plan time: <span className="line-through">{planTime}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
              <span className="text-[14px] leading-normal">{time}, {frequency}</span>
            </div>
          )}

          {/* Time Critical Badge */}
          {timeCritical && (
            <div className="flex items-start gap-2 mb-1 ml-5">
              <AlarmClock className="w-3.5 h-3.5 text-[#e31a1a] flex-shrink-0 mt-[4px]" />
              <span className="text-[14px] leading-normal text-[#e31a1a] font-medium">Time critical</span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-start gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
            <span className="text-[14px] leading-normal">{date}</span>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
            <span className="text-[14px] leading-normal">{address}</span>
          </div>

          {/* Phone */}
          {phone && (
            <div className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
              <span className="text-[14px] leading-normal">{phone}</span>
            </div>
          )}
        </div>

        {/* Employees Section */}
        <div className="pt-3 border-t border-gray-200 mt-4">
          <div className="text-[14px] mb-2">{assignedCount} employees assigned</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {assignedEmployees.map((employee, index) => (
              <div key={index} className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-[14px]">{employee.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conflict Alert */}
        {conflictMessage && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-lg flex items-center gap-3">
              <CustomAlertIcon className="w-5 h-5 text-[#e31a1a] flex-shrink-0" />
              <span className="text-[14px] text-gray-900">{conflictMessage}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-300 p-6 min-w-[280px] ${maxWidth}`}>
      {/* Header Section */}
      <div className="flex gap-4 mb-6">
        {/* Avatar */}
        <div
          className="w-[60px] h-[60px] rounded-full flex items-center justify-center flex-shrink-0 text-[24px] font-bold text-gray-900"
          style={{ backgroundColor: avatarColor }}
        >
          {initials}
        </div>

        {/* Visit Info */}
        <div className="flex-1">
          <h3 className="text-[18px] leading-tight mb-2">
            <span className="font-semibold">{visitType}{visitType === 'Day Sit' ? '' : ' Visit'}</span>
            <span className="font-normal"> with </span>
            <span className="font-semibold">{clientName}</span>
          </h3>
          
          {/* Time Display */}
          {adjustedTime ? (
            <div className="mb-1">
              <div className="flex items-start gap-2 mb-1">
                <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
                <span className="text-[14px] leading-normal">Adjusted time</span>
                {timeIsLater ? (
                  <FastForward className="w-4 h-4 text-amber-500 flex-shrink-0 mt-[4px]" />
                ) : (
                  <Rewind className="w-4 h-4 text-amber-500 flex-shrink-0 mt-[4px]" />
                )}
                <span className="text-[14px] leading-normal font-semibold text-amber-500">{adjustedTime}, {frequency}</span>
              </div>
              <div className="flex items-start gap-2 text-[14px] leading-normal text-gray-500 ml-5">
                Plan time: <span className="line-through">{planTime}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
              <span className="text-[14px] leading-normal">{time}, {frequency}</span>
            </div>
          )}

          {/* Time Critical Badge */}
          {timeCritical && (
            <div className="flex items-start gap-2 mb-1 ml-5">
              <AlarmClock className="w-3.5 h-3.5 text-[#e31a1a] flex-shrink-0 mt-[4px]" />
              <span className="text-[14px] leading-normal text-[#e31a1a] font-medium">Time critical</span>
            </div>
          )}

          {/* Date */}
          <div className="flex items-start gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
            <span className="text-[14px] leading-normal">{date}</span>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 mb-1">
            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
            <span className="text-[14px] leading-normal">{address}</span>
          </div>

          {/* Phone */}
          {phone && (
            <div className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
              <span className="text-[14px] leading-normal">{phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Employees Section */}
      <div className="pt-3 border-t border-gray-200">
        <div className="text-[14px] mb-2">{assignedCount} employees assigned</div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {assignedEmployees.map((employee, index) => (
            <div key={index} className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-[14px]">{employee.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Alert */}
      {conflictMessage && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="bg-red-50 px-4 py-3 border border-red-200 rounded-lg flex items-center gap-3">
            <CustomAlertIcon className="w-5 h-5 text-[#e31a1a] flex-shrink-0" />
            <span className="text-[14px] text-gray-900">{conflictMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Shift/Run Card Component
interface ShiftCardProps {
  runName: string;
  visitCount: number;
  status: 'pending' | 'confirmed' | 'completed';
  time: string;
  date: string;
  frequency: string;
  assignedCount: string;
  assignedEmployees: { name: string }[];
  careType: 'personal-care' | 'companionship' | 'live-in';
  area: 'area-1' | 'area-2' | 'area-3' | 'area-4' | 'area-5' | 'area-6' | 'area-7' | 'area-8' | 'area-9' | 'area-10' | 'area-11' | 'area-12';
  payable?: boolean;
  chargeable?: boolean;
  shiftDetails?: string;
  maxWidth?: string;
}

const ShiftCard = ({
  runName,
  visitCount,
  status,
  time,
  date,
  frequency,
  assignedCount,
  assignedEmployees,
  careType,
  area,
  payable = true,
  chargeable = true,
  shiftDetails = '1 shift',
  maxWidth = 'max-w-[480px]',
}: ShiftCardProps) => {
  const statusConfigs = {
    'pending': {
      bgColor: 'rgba(107, 114, 128, 0.1)',
      textColor: 'rgb(55, 65, 81)',
      borderColor: 'rgba(107, 114, 128, 0.3)',
    },
    'confirmed': {
      bgColor: 'rgba(34, 197, 94, 0.1)',
      textColor: 'rgb(21, 128, 61)',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    },
    'completed': {
      bgColor: 'rgba(59, 130, 246, 0.1)',
      textColor: 'rgb(29, 78, 216)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
  };

  const statusConfig = statusConfigs[status];

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-300 p-6 min-w-[280px] ${maxWidth}`}>
      {/* Header Section */}
      <div className="pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <RunIcon className="w-6 h-6 text-gray-700" style={{ transform: 'translate(-1px, -1px)' }} />
          </div>
          <h3 className="text-[18px] font-semibold leading-tight">
            {runName} ({visitCount})
          </h3>
        </div>
        
        {/* Status Badge */}
        {status === 'pending' ? (
          <span 
            className="inline-block text-[14px] font-medium leading-5 cursor-pointer"
            style={{
              color: 'rgb(51, 51, 51)',
              padding: '3px 10px 3px 20px',
              border: '1px solid rgb(204, 204, 204)',
              borderRadius: '4px',
              background: 'linear-gradient(90deg, rgba(0, 0, 0, 0) 10px, rgb(255, 255, 255) 10px), repeating-linear-gradient(135deg, rgb(153, 153, 153), rgb(153, 153, 153) 1px, rgb(102, 102, 102) 1px, rgb(102, 102, 102) 4px)',
              boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 1px 0px, rgba(0, 0, 0, 0.03) 0px 1px 1px 0px, rgba(0, 0, 0, 0.04) 0px 1px 3px 0px',
            }}
          >
            Pending
          </span>
        ) : (
          <span 
            className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium capitalize leading-[1.4]"
            style={{
              backgroundColor: statusConfig.bgColor,
              color: statusConfig.textColor,
              border: `1px solid ${statusConfig.borderColor}`,
            }}
          >
            {status}
          </span>
        )}
      </div>

      {/* Details Section */}
      <div className="pt-4 pb-4 border-b border-gray-200">
        {/* Time */}
        <div className="flex items-start gap-2 mb-1">
          <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
          <span className="text-[14px] leading-normal">{time}</span>
        </div>

        {/* Date */}
        <div className="flex items-start gap-2">
          <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-[4px]" />
          <span className="text-[14px] leading-normal">{date}</span>
        </div>
      </div>

      {/* Employees Section */}
      <div className="pt-4 pb-4 border-b border-gray-200">
        <div className="text-[14px] mb-2">{assignedCount} employees assigned</div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {assignedEmployees.map((employee, index) => (
            <div key={index} className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-[14px]">{employee.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Template Section */}
      <div className="pt-4">
        <h4 className="text-[14px] font-semibold mb-3 text-gray-700">Template</h4>
        
        {/* Tags */}
        <div className="flex items-center gap-2 mb-3">
          <CareTypeTag type={careType} />
          <AreaTag area={area} />
        </div>

        {/* Metadata */}
        <div className="space-y-1 text-[13px]">
          <div className="text-[15px] text-[14px]"><span className="font-medium">Payable:</span> {payable ? 'Yes' : 'No'}</div>
          <div className="text-[14px]"><span className="font-medium">Chargeable:</span> {chargeable ? 'Yes' : 'No'}</div>
          <div className="text-gray-600 text-[14px]">{frequency}, {shiftDetails}</div>
        </div>

        {/* Default Employees */}
        <div className="mt-3">
          <div className="text-[14px] font-medium mb-2">Default employees</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {assignedEmployees.map((employee, index) => (
              <div key={index} className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-[14px]">{employee.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const CombinedAlerts = () => {
  const [activeTab, setActiveTab] = React.useState<'visit-cards' | 'tag-guides'>('visit-cards');

  return (
    <div className="p-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Component Style Guide</h1>
        <p className="text-gray-600">Examples and documentation for UI components</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-t-lg border border-gray-300 border-b-0">
        <div className="flex gap-1 px-6 border-b border-gray-100">
          <TabButton 
            label="Visit Cards" 
            isActive={activeTab === 'visit-cards'} 
            onClick={() => setActiveTab('visit-cards')} 
          />
          <TabButton 
            label="Tag Style Guides" 
            isActive={activeTab === 'tag-guides'} 
            onClick={() => setActiveTab('tag-guides')} 
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg border border-gray-300 p-8">
        {activeTab === 'visit-cards' && (
          <>
            {/* Aligned Variant Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Aligned Header Variant</h2>
              <div className="grid grid-cols-2 gap-8">
                {/* Scenario 1: Time Critical Visit - Aligned */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Scenario 1: Time Critical Visit</h3>
                  <VisitCard
                    variant="aligned"
                    careType="personal-care"
                    area="area-1"
                    initials="NI"
                    avatarColor="#d4c5a0"
                    visitType="Tea"
                    clientName="Nishat Iftikhar"
                    time="18:00 - 18:30"
                    frequency="Daily"
                    date="Tuesday, Mar 10th, 2026"
                    address="Flat 36, Oakfield Lodge, Albert Road, IG1 1HU"
                    timeCritical={true}
                    assignedCount="1/1"
                    assignedEmployees={[{ name: "Fatema Begum Koli" }]}
                    maxWidth="max-w-[400px]"
                  />
                </div>

                {/* Scenario 2: Multiple Employees with Phone - Aligned */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Scenario 2: Multiple Employees & Phone Number</h3>
                  <VisitCard
                    variant="aligned"
                    careType="companionship"
                    area="area-2"
                    initials="LC"
                    avatarColor="#d4a5a5"
                    visitType="Social Group"
                    clientName="Lai Chu"
                    time="16:30 - 17:15"
                    frequency="Daily"
                    date="Tuesday, Mar 10th, 2026"
                    address="34 Loxford Lane, IG1 2SA"
                    phone="02085146434"
                    assignedCount="2/2"
                    assignedEmployees={[
                      { name: "Maisha Kamali" },
                      { name: "Halima Begum 941" }
                    ]}
                    maxWidth="max-w-[400px]"
                  />
                </div>

                {/* Scenario 3: Adjusted Time with Conflict - Aligned */}
                <div className="col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Scenario 3: Adjusted Time with Conflict Alert</h3>
                  <VisitCard
                    variant="aligned"
                    careType="live-in"
                    area="area-3"
                    initials="JC"
                    avatarColor="#b8b8cc"
                    visitType="Day Sit"
                    clientName="Jabu Hussain Choudhury"
                    time="08:00 - 20:00"
                    frequency="Daily"
                    adjustedTime="08:00 - 20:00"
                    planTime="09:00 - 21:00"
                    date="Tuesday, Mar 10th, 2026"
                    address="103 Millard Terrace, RM10 8RQ"
                    phone="07404824279 / 07424917865 / 07417430703"
                    assignedCount="1/1"
                    assignedEmployees={[{ name: "MD Abdul Malek" }]}
                    conflictMessage="This booking clashes with another Visit"
                    maxWidth="max-w-[400px]"
                  />
                </div>

                {/* Scenario 4: Shift/Run Container - Aligned */}
                <div className="col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Scenario 4: Shift/Run Container</h3>
                  <ShiftCard
                    runName="double run"
                    visitCount={2}
                    status="pending"
                    time="11:55 - 13:55"
                    date="Wednesday, Mar 11th, 2026"
                    frequency="Daily"
                    assignedCount="2/2"
                    assignedEmployees={[
                      { name: "Drift King" },
                      { name: "Malinga Ranatunga" }
                    ]}
                    careType="companionship"
                    area="area-4"
                    payable={true}
                    chargeable={true}
                    shiftDetails="1 shift"
                    maxWidth="max-w-[400px]"
                  />
                </div>
              </div>
            </div>

            {/* Dividing Line */}
            <div className="border-t-2 border-gray-300 mb-12"></div>

            {/* Default Variant Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Default Variant</h2>
              <div className="grid grid-cols-2 gap-8">
                {/* Scenario 1: Time Critical Visit */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Scenario 1: Time Critical Visit</h3>
                  <VisitCard
                    initials="NI"
                    avatarColor="#d4c5a0"
                    visitType="Tea"
                    clientName="Nishat Iftikhar"
                    time="18:00 - 18:30"
                    frequency="Daily"
                    date="Tuesday, Mar 10th, 2026"
                    address="Flat 36, Oakfield Lodge, Albert Road, IG1 1HU"
                    timeCritical={true}
                    assignedCount="1/1"
                    assignedEmployees={[{ name: "Fatema Begum Koli" }]}
                    maxWidth="max-w-[400px]"
                  />
                </div>

                {/* Scenario 2: Multiple Employees with Phone */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Scenario 2: Multiple Employees & Phone Number</h3>
                  <VisitCard
                    initials="LC"
                    avatarColor="#d4a5a5"
                    visitType="Social Group"
                    clientName="Lai Chu"
                    time="16:30 - 17:15"
                    frequency="Daily"
                    date="Tuesday, Mar 10th, 2026"
                    address="34 Loxford Lane, IG1 2SA"
                    phone="02085146434"
                    assignedCount="2/2"
                    assignedEmployees={[
                      { name: "Maisha Kamali" },
                      { name: "Halima Begum 941" }
                    ]}
                    maxWidth="max-w-[400px]"
                  />
                </div>

                {/* Scenario 3: Adjusted Time with Conflict */}
                <div className="col-span-2">
                  <h3 className="text-xl font-semibold mb-4 text-gray-700">Scenario 3: Adjusted Time with Conflict Alert</h3>
                  <VisitCard
                    initials="JC"
                    avatarColor="#b8b8cc"
                    visitType="Day Sit"
                    clientName="Jabu Hussain Choudhury"
                    time="08:00 - 20:00"
                    frequency="Daily"
                    adjustedTime="08:00 - 20:00"
                    planTime="09:00 - 21:00"
                    date="Tuesday, Mar 10th, 2026"
                    address="103 Millard Terrace, RM10 8RQ"
                    phone="07404824279 / 07424917865 / 07417430703"
                    assignedCount="1/1"
                    assignedEmployees={[{ name: "MD Abdul Malek" }]}
                    conflictMessage="This booking clashes with another Visit"
                    maxWidth="max-w-[400px]"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'tag-guides' && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Tag Style Guides</h2>
            
            {/* Care Type Tags */}
            <div className="mb-10">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Care Type Tags</h3>
              <p className="text-gray-600 mb-4">Tags to indicate the type of care service being provided.</p>
              <div className="flex flex-wrap gap-4 items-center py-4">
                <CareTypeTag type="personal-care" />
                <CareTypeTag type="companionship" />
                <CareTypeTag type="live-in" />
                <CareTypeTag type="sleeping-night" />
                <CareTypeTag type="waking-night" />
                <CareTypeTag type="complex-care" />
                <CareTypeTag type="shopping" />
                <CareTypeTag type="couple" />
                <CareTypeTag type="custom" />
              </div>
            </div>

            {/* Area Tags */}
            <div className="mb-10">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Area Tags</h3>
              <p className="text-gray-600 mb-4">Tags to indicate the geographical area for service coverage. These colors should be applied in sequence to any areas added to the system. It is unlikely an office will have more than 12 areas.</p>
              <div className="flex flex-wrap gap-4 items-center py-4">
                <AreaTag area="area-1" />
                <AreaTag area="area-2" />
                <AreaTag area="area-3" />
                <AreaTag area="area-4" />
                <AreaTag area="area-5" />
                <AreaTag area="area-6" />
                <AreaTag area="area-7" />
                <AreaTag area="area-8" />
                <AreaTag area="area-9" />
                <AreaTag area="area-10" />
                <AreaTag area="area-11" />
                <AreaTag area="area-12" />
              </div>
            </div>

            {/* Tag Guidelines */}
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Usage Guidelines</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="text-[rgb(154,38,214)]">•</span>
                  <span>All tags use rounded-xl corners for a modern, friendly appearance</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[rgb(154,38,214)]">•</span>
                  <span>Care Type and Area tags include relevant icons for quick visual identification</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[rgb(154,38,214)]">•</span>
                  <span>Colors use subtle transparency (0.082 opacity) for backgrounds with softened borders (0.2-0.3 opacity)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[rgb(154,38,214)]">•</span>
                  <span>Text colors are darker variants of the border color for optimal readability</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[rgb(154,38,214)]">•</span>
                  <span>Tags should maintain consistent spacing (px-3 py-1) and use text-xs for font size</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};