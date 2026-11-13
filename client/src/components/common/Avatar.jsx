import React from 'react';

export const Avatar = ({ user, size = 'md', className = '' }) => {
  const name = user?.name || 'User';
  const avatarUrl = user?.avatar;

  const getInitials = (n) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const colors = [
    'bg-indigo-500 text-white',
    'bg-emerald-500 text-white',
    'bg-rose-500 text-white',
    'bg-amber-500 text-white',
    'bg-sky-500 text-white',
    'bg-purple-500 text-white'
  ];

  // Stable color based on name hash
  const colorIndex =
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
    xl: 'w-14 h-14 text-lg'
  };

  if (avatarUrl && avatarUrl.startsWith('http')) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        title={name}
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-sm ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return (
    <div
      title={name}
      className={`${sizeClasses[size] || sizeClasses.md} ${colors[colorIndex]} font-semibold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-sm select-none ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
