import React from 'react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  title = 'No items found',
  description = 'There are no items matching your criteria right now.',
  actionLabel,
  actionTo,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white border border-[#E8E2D5] rounded-lg">
      <h3 className="font-heading text-base font-semibold text-[#1C1C1C] mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-[#5C5C5C] max-w-md mb-5 leading-relaxed">
        {description}
      </p>
      {actionTo && actionLabel && (
        <Link
          to={actionTo}
          className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-md bg-[#1B4D3E] text-white hover:bg-[#13392D] transition-colors"
        >
          {actionLabel}
        </Link>
      )}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center px-4 py-2 text-xs font-medium rounded-md bg-[#1B4D3E] text-white hover:bg-[#13392D] transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
