
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

export const RaceHorseIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M14.21 2.373a1.5 1.5 0 0 0-2.42 0l-.304.345-2.23-1.488a1.5 1.5 0 0 0-1.874.408l-2.036 3.054a1.5 1.5 0 0 0 .408 1.874l1.63 1.086-2.583 2.583a1.5 1.5 0 0 0 0 2.122l2.12 2.12a1.5 1.5 0 0 0 2.123 0l5.88-5.879a1.5 1.5 0 0 0 .423-1.06l.01-.223.51-3.057a1.5 1.5 0 0 0-1.2-1.725l-3.057-.51-.223.01a1.5 1.5 0 0 0-1.06.423L6.37 13.16l-1.06-1.06L7.5 9.918l.885-.59.305-.345a1.5 1.5 0 0 0 0-2.12L7.387 5.56l1.222-.815.748.498.305-.345ZM20.25 10.5a.75.75 0 0 0-1.5 0v2.164l-2.28-2.28a.75.75 0 0 0-1.06 1.06l2.28 2.28h-2.164a.75.75 0 0 0 0 1.5h2.164l-2.28 2.28a.75.75 0 0 0 1.06 1.06l2.28-2.28v2.164a.75.75 0 0 0 1.5 0v-2.164l2.28 2.28a.75.75 0 0 0 1.06-1.06l-2.28-2.28h2.164a.75.75 0 0 0 0-1.5h-2.164l2.28-2.28a.75.75 0 0 0-1.06-1.06l-2.28 2.28V10.5Z" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.658-2.658L11.25 18l1.938-.648a3.375 3.375 0 002.658-2.658L16.25 13.5l.648 1.938a3.375 3.375 0 002.658 2.658L21 18.75l-1.938.648a3.375 3.375 0 00-2.658 2.658z" />
    </svg>
);

export const InformationCircleIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

export const TrophyIcon: React.FC<IconProps> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9a9 9 0 119 0zM16.5 18.75a9 9 0 00-9 0m9 0h.008v.008h-.008v-.008zm-9 0h-.008v.008h.008v-.008zM16.5 18.75a9 9 0 01-9 0m9 0a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM12 12.75V15" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-4.5-8.25L12 3m0 0L7.5 4.5M12 3v2.25m0 0l4.5 2.25M12 5.25L7.5 7.5" />
    </svg>
);
