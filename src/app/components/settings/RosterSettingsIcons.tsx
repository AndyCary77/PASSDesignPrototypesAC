/**
 * Section icons, taken from the live Roster Settings menu. All inherit colour
 * via currentColor and take their size from `className`.
 */
type IconProps = { className?: string };

const Svg = ({ className, viewBox, children }: IconProps & { viewBox: string; children: React.ReactNode }) => (
  <svg className={className} viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true">
    {children}
  </svg>
);

export const VisitTypesIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 25 25">
    <g fill="none" fillRule="evenodd">
      <path d="M.395.846h24v24h-24z" />
      <path d="M12.398 5c1.661 0 3.16.673 4.243 1.764a6.06 6.06 0 0 1 1.754 4.287c0 1.978-.731 3.366-2.436 5.385l-.762.886c-1.01 1.182-1.787 2.169-2.514 3.228-1.488-1.295-2.207-2.202-3.096-3.24l-.769-.895-.373-.452-.332-.42a10.117 10.117 0 0 1-1.021-1.579 6.193 6.193 0 0 1-.697-2.913c0-1.677.669-3.192 1.756-4.286A5.96 5.96 0 0 1 12.398 5z" stroke="currentColor" strokeWidth="2" />
      <path d="M12.395 9.5c-.824 0-1.5.676-1.5 1.5s.676 1.5 1.5 1.5 1.5-.676 1.5-1.5-.676-1.5-1.5-1.5z" fill="currentColor" />
    </g>
  </Svg>
);

export const ContractsIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 25 24">
    <g fill="none" fillRule="evenodd">
      <path d="M.395 0h24v24h-24z" />
      <path d="M8.84 3a3.318 3.318 0 0 0-3.326 3.31v11.38A3.318 3.318 0 0 0 8.839 21h7.216a3.318 3.318 0 0 0 3.323-3.31V8.467a2 2 0 0 0-.644-1.471l-3.761-3.467A2 2 0 0 0 13.617 3zm.092 1.982h4.529v2.297c0 .985.801 1.783 1.79 1.783h2.17v8.45a1.5 1.5 0 0 1-1.5 1.5h-6.99a1.5 1.5 0 0 1-1.5-1.5V6.483a1.5 1.5 0 0 1 1.5-1.5zm3.463 8.898a1.44 1.44 0 1 1 0-2.88 1.44 1.44 0 0 1 0 2.88zm-1.008.6h.188a1.96 1.96 0 0 0 1.64 0h.188c.835 0 1.512.87 1.512 1.705v.275a.54.54 0 0 1-.54.54h-3.96a.54.54 0 0 1-.54-.54v-.275c0-.835.677-1.705 1.512-1.705z" fill="currentColor" fillRule="nonzero" />
    </g>
  </Svg>
);

export const ChargingIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 25 24">
    <g fill="none" fillRule="evenodd">
      <path d="M.395 0h24v24h-24z" />
      <path d="m20.543 14.608-3.208 2.566a2.21 2.21 0 0 1-1.39.486H11.84a.556.556 0 0 1 0-1.111h2.719c.552 0 1.066-.379 1.154-.924a1.111 1.111 0 0 0-1.095-1.299h-4.555c-.937 0-1.846.323-2.573.913l-1.615 1.31H3.951a.556.556 0 0 0-.556.555v3.334c0 .306.249.555.556.555h11.387c.505 0 .995-.17 1.389-.486l5.251-4.201a1.111 1.111 0 0 0 .044-1.698c-.41-.372-1.049-.347-1.48 0z" fill="currentColor" fillRule="nonzero" />
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="2">
        <path d="M15.395 10.5V12h-6 1V6.284c.01-.955.398-1.637 1.167-2.049.768-.411 1.712-.283 2.833.387" strokeLinejoin="round" />
        <path d="M9.395 8h3" />
      </g>
    </g>
  </Svg>
);

export const TimeThresholdsIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 25 24">
    <g fill="none" fillRule="evenodd">
      <path d="M.395 0h24v24h-24z" />
      <path d="M14.395 1h-4c-.55 0-1 .45-1 1s.45 1 1 1h4c.55 0 1-.45 1-1s-.45-1-1-1zm-2 13c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1s-1 .45-1 1v4c0 .55.45 1 1 1zm7.03-6.61.75-.75a.993.993 0 0 0 0-1.4l-.01-.01a.993.993 0 0 0-1.4 0l-.75.75A8.962 8.962 0 0 0 12.395 4c-4.8 0-8.88 3.96-9 8.76a8.998 8.998 0 0 0 9 9.24 8.994 8.994 0 0 0 7.03-14.61zM12.395 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" fill="currentColor" />
    </g>
  </Svg>
);

export const ExpenseTypesIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 25 24">
    <g fill="none" fillRule="evenodd">
      <path d="M.395 0h24v24h-24z" />
      <path d="M17.658 9c.553 0 1.053.224 1.415.586.362.362.585.862.585 1.414v6c0 .552-.223 1.052-.585 1.414a1.994 1.994 0 0 1-1.415.586H8.132a2.99 2.99 0 0 1-2.122-.879A2.99 2.99 0 0 1 5.132 16v-6a.997.997 0 0 1 1-1z" stroke="currentColor" strokeWidth="2" />
      <g stroke="currentColor" strokeLinecap="round">
        <path d="M12.007 15.25V16H8.908h.517v-2.858c.005-.477.205-.819.602-1.024.397-.206.885-.142 1.463.193" strokeLinejoin="round" />
        <path d="M8.908 14h1.55" />
      </g>
      <path d="M18.467 6a3.552 3.552 0 0 0-2.471-1H7.165a2 2 0 1 0 0 4h6.316" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path fill="currentColor" d="M4.132 7h2.066v4H4.132z" />
    </g>
  </Svg>
);

export const CancellationReasonsIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 32 32">
    <g fill="none" fillRule="evenodd">
      <path d="M0 .795h32v32H0z" />
      <path d="M13.337 5c4.707 0 8.572 3.47 9.23 8.02a8.686 8.686 0 0 0-2.664.236c-.53-3.189-3.257-5.59-6.566-5.59-3.698 0-6.67 2.995-6.67 6.735 0 1.208.246 2.228.783 3.278.308.602.686 1.189 1.215 1.879l.42.531.483.586 1.035 1.206a58.441 58.441 0 0 1 2.505 3.11l.228.309.123-.17c.127-.17.256-.343.388-.516.337.93.827 1.786 1.441 2.536-.187.26-.37.522-.552.788l-.265.424a1.332 1.332 0 0 1-2.252.01l-.159-.247-.122-.185c-.967-1.419-2.022-2.761-3.36-4.325l-1.033-1.202-.516-.625-.457-.578c-.644-.84-1.11-1.561-1.497-2.318A9.547 9.547 0 0 1 4 14.401C4 9.193 8.161 5 13.337 5zm-.004 7.333c1.1 0 2 .901 2 2 0 1.1-.9 2-2 2-1.099 0-2-.9-2-2 0-1.099.901-2 2-2z" fill="currentColor" fillRule="nonzero" />
      <path d="M22 14.333A7.333 7.333 0 1 1 22 29a7.333 7.333 0 0 1 0-14.667zm3.58 2.785a.667.667 0 0 0-.851.077L22 19.924l-2.729-2.729a.667.667 0 0 0-.942 0l-.8.8-.078.093c-.18.26-.154.619.078.85l2.728 2.729-2.728 2.728a.667.667 0 0 0 0 .943l.8.8.092.077c.26.18.619.154.85-.077L22 23.41l2.729 2.73c.26.26.682.26.942 0l.8-.8.078-.093a.667.667 0 0 0-.078-.85l-2.728-2.73 2.728-2.728a.667.667 0 0 0 0-.943l-.8-.8z" fill="currentColor" />
    </g>
  </Svg>
);

export const HolidaysIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 25 24">
    <g fill="none" fillRule="evenodd">
      <path d="M0 0h24.79v24H0z" />
      <path d="M19.626 4h-1.033V3c0-.55-.465-1-1.033-1-.568 0-1.033.45-1.033 1v1H8.263V3c0-.55-.464-1-1.033-1-.568 0-1.032.45-1.032 1v1H5.165c-1.147 0-2.056.9-2.056 2L3.1 20c0 1.1.92 2 2.066 2h14.46c1.137 0 2.066-.9 2.066-2V6c0-1.1-.93-2-2.065-2zm0 15c0 .55-.465 1-1.033 1H6.198c-.569 0-1.033-.45-1.033-1V9h14.46v10zM7.23 11h2.066v2H7.23v-2zm4.132 0h2.066v2h-2.066v-2zm4.132 0h2.066v2h-2.066v-2zM7.23 15h2.066v2H7.23v-2zm4.132 0h2.066v2h-2.066v-2zm4.132 0h2.066v2h-2.066v-2z" fill="currentColor" />
    </g>
  </Svg>
);

export const OfficeCalendarIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 24 24">
    <g fill="none" fillRule="evenodd">
      <path d="M0 0h24v24H0z" />
      <path d="M16 3a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 1 1 2 0v1h6V4a1 1 0 0 1 1-1zm1.5 6h-11a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-8a.5.5 0 0 0-.5-.5zm-6 2a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h3z" fill="currentColor" />
    </g>
  </Svg>
);

export const CommunicationsIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 32 32">
    <g fill="none" fillRule="evenodd">
      <path d="M0 0h32v32H0z" />
      <path d="M26.667 5.333H5.333A2.663 2.663 0 0 0 2.68 8l-.013 16c0 1.467 1.2 2.667 2.666 2.667h21.334c1.466 0 2.666-1.2 2.666-2.667V8c0-1.467-1.2-2.667-2.666-2.667zM25.333 24H6.667c-.734 0-1.334-.6-1.334-1.333v-12l9.254 5.786c.866.547 1.96.547 2.826 0l9.254-5.786v12c0 .733-.6 1.333-1.334 1.333zM16 14.667 5.333 8h21.334L16 14.667z" fill="currentColor" />
    </g>
  </Svg>
);

export const AdvancedSettingsIcon = ({ className }: IconProps) => (
  <Svg className={className} viewBox="0 0 25 24">
    <g fill="none" fillRule="evenodd">
      <path d="M8,5 C9.65685425,5 11,6.34314575 11,8 C11,9.65685425 9.65685425,11 8,11 C6.69411778,11 5.58311485,10.1656226 5.17102423,9.00090072 L4,9 C3.44771525,9 3,8.55228475 3,8 C3,7.44771525 3.44771525,7 4,7 L5.17067428,7.00008893 C5.58248558,5.8348501 6.69374794,5 8,5 Z M8,7 C7.44771525,7 7,7.44771525 7,8 C7,8.55228475 7.44771525,9 8,9 C8.55228475,9 9,8.55228475 9,8 C9,7.44771525 8.55228475,7 8,7 Z M16,13 C17.3062521,13 18.4175144,13.8348501 18.8293257,15.0000889 L20,15 C20.5522847,15 21,15.4477153 21,16 C21,16.5522847 20.5522847,17 20,17 L18.8289758,17.0009007 C18.4168852,18.1656226 17.3058822,19 16,19 C14.3431458,19 13,17.6568542 13,16 C13,14.3431458 14.3431458,13 16,13 Z M16,15 C15.4477153,15 15,15.4477153 15,16 C15,16.5522847 15.4477153,17 16,17 C16.5522847,17 17,16.5522847 17,16 C17,15.4477153 16.5522847,15 16,15 Z M13,7 L20,7 C20.5522847,7 21,7.44771525 21,8 C21,8.55228475 20.5522847,9 20,9 L13,9 L13,7 Z M11,15 L4,15 C3.44771525,15 3,15.4477153 3,16 C3,16.5522847 3.44771525,17 4,17 L11,17 L11,15 Z" fill="currentColor" />
    </g>
  </Svg>
);
