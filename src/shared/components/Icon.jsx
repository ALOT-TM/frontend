import React from 'react';

const icons = {
  prohibited: (
    <circle cx="12" cy="12" r="10" />
  ),
  close: (
    <path d="M18 6L6 18M6 6l12 12" />
  ),
  plus: (
    <path d="M12 5v14M5 12h14" />
  ),
  loading: (
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  ),
  check: (
    <path d="M20 6L9 17l-5-5" />
  ),
  package: (
    <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
  ),
  gift: (
    <path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
  ),
  school: (
    <path d="M22 10l-10-5L2 10v2l10-5 10 5v-2zM6 12v5a4 4 0 004 4h4a4 4 0 004-4v-5" />
  ),
  memo: (
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
  ),
  store: (
    <path d="M3 9l1.5-5h15L21 9M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9M6 9V5h12v4M9 9h6v6H9z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    </>
  ),
  chart: (
    <path d="M18 20V10M12 20V4M6 20v-6" />
  ),
  home: (
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
  ),
  handshake: (
    <path d="M20.42 4.58a5.4 5.4 0 00-7.65 0l-.77.78-.77-.78a5.4 5.4 0 00-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
  ),
  clipboard: (
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
  ),
  truck: (
    <path d="M1 17h2M15 17h2M1 9V5a2 2 0 012-2h12v12H3a2 2 0 01-2-2v-4zM15 9h4l3 3v4h-2" />
  ),
  spinner: (
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  ),
};

const Icon = ({ name, size = 20, className = '', style = {} }) => {
  const path = icons[name];
  if (!path) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      {path}
      {name === 'prohibited' && <path d="M4.93 4.93l14.14 14.14" />}
    </svg>
  );
};

export default Icon;
