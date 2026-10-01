import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';
// problemId: on a submission page, the problem it belongs to (from the API), for the middle link
const Breadcrumb = ({ problemId }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Do not show breadcrumb on the Problem Statements List page
  if (location.pathname === '/admin/problems') {
    return null;
  }

  let breadcrumbItems = [];

  if (location.pathname.match(/^\/admin\/problems\/[^\/]+\/details$/)) {
    breadcrumbItems = [
      { label: 'Problem Statements', path: '/admin/problems' },
      { label: 'Problem Statement Details', path: location.pathname },
    ];
  } else if (location.pathname.match(/^\/admin\/submissions\/[^\/]+\/details$/)) {
    breadcrumbItems = [
      { label: 'Problem Statements', path: '/admin/problems' },
      ...(problemId ? [{ label: 'Problem Statement Details', path: `/admin/problems/${problemId}/details` }] : []),
      { label: 'Submission Details', path: location.pathname },
    ];
  } else {
    // Fallback for other pages
    breadcrumbItems = [
      ...pathnames.slice(1).map((pathname, index) => {
        const path = `/${pathnames.slice(0, index + 2).join('/')}`;
        const label = pathname.charAt(0).toUpperCase() + pathname.slice(1);
        return { label, path };
      }),
    ];
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <FiChevronRight className="w-4 h-4" />}
          {index === breadcrumbItems.length - 1 ? (
            <span className="text-gray-900 font-medium">{item.label}</span>
          ) : (
            <Link
              to={item.path}
              className="hover:text-blue-600 flex items-center space-x-1"
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
