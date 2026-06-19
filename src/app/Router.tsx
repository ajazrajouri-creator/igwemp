import React, { Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { ROUTES } from '../lib/constants';

// Loading fallback
const PageLoader = () => <div className="p-8 text-ink-muted text-center">Loading...</div>;

// Eager load core shells and auth
import { LoginPage } from '../pages/StubPages';
import { AdminLayout } from '../pages/admin/AdminLayout';

// Lazy load operational pages (Performance/Low-bandwidth optimization)
const MyWorkQueuePage = React.lazy(() => import('../pages/workqueue/MyWorkQueuePage').then(m => ({ default: m.MyWorkQueuePage })));
const SectionQueuePage = React.lazy(() => import('../pages/workqueue/SectionQueuePage').then(m => ({ default: m.SectionQueuePage })));

const OrdersListPage = React.lazy(() => import('../pages/orders/OrdersListPage').then(m => ({ default: m.OrdersListPage })));
const CasesListPage = React.lazy(() => import('../pages/cases/CasesListPage').then(m => ({ default: m.CasesListPage })));

const AdminWorkflowsPage = React.lazy(() => import('../pages/admin/AdminWorkflowsPage').then(m => ({ default: m.AdminWorkflowsPage })));
const PostManagementGrid = React.lazy(() => import('../pages/admin/PostManagementGrid').then(m => ({ default: m.PostManagementGrid })));
const AdminOrganizationsPage = React.lazy(() => import('../pages/admin/AdminOrganizationsPage').then(m => ({ default: m.AdminOrganizationsPage })));
const AdminHierarchyPage = React.lazy(() => import('../pages/admin/AdminHierarchyPage').then(m => ({ default: m.AdminHierarchyPage })));
const AdminOfficesPage = React.lazy(() => import('../pages/admin/AdminOfficesPage').then(m => ({ default: m.AdminOfficesPage })));
const AdminSectionsPage = React.lazy(() => import('../pages/admin/AdminSectionsPage').then(m => ({ default: m.AdminSectionsPage })));
const AdminMasterDataPage = React.lazy(() => import('../pages/admin/AdminMasterDataPage').then(m => ({ default: m.AdminMasterDataPage })));
const AdminUsersPage = React.lazy(() => import('../pages/admin/AdminUsersPage').then(m => ({ default: m.AdminUsersPage })));
const AdminRolesPoliciesPage = React.lazy(() => import('../pages/admin/AdminRolesPoliciesPage').then(m => ({ default: m.AdminRolesPoliciesPage })));
const AdminRoleAssignmentsPage = React.lazy(() => import('../pages/admin/AdminRoleAssignmentsPage').then(m => ({ default: m.AdminRoleAssignmentsPage })));
const AdminDelegationsPage = React.lazy(() => import('../pages/admin/AdminDelegationsPage').then(m => ({ default: m.AdminDelegationsPage })));
const AdminResponsibilitiesPage = React.lazy(() => import('../pages/admin/AdminResponsibilitiesPage').then(m => ({ default: m.AdminResponsibilitiesPage })));

const EmployeesListPage = React.lazy(() => import('../pages/employees/EmployeesListPage').then(m => ({ default: m.EmployeesListPage })));
const EmployeeDetailPage = React.lazy(() => import('../pages/employees/EmployeeProfilePage').then(m => ({ default: m.EmployeeProfilePage })));
const EmployeeBulkImportPage = React.lazy(() => import('../pages/employees/EmployeeBulkImportPage').then(m => ({ default: m.EmployeeBulkImportPage })));

// Stubs
const StubPages = import('../pages/StubPages');
const OfficeInboxPage = React.lazy(() => StubPages.then(m => ({ default: m.OfficeInboxPage })));
const OrderCreatePage = React.lazy(() => StubPages.then(m => ({ default: m.OrderCreatePage })));
const OrderDetailPage = React.lazy(() => StubPages.then(m => ({ default: m.OrderDetailPage })));
const CaseDetailPage = React.lazy(() => StubPages.then(m => ({ default: m.CaseDetailPage })));
const DelegationPage = React.lazy(() => StubPages.then(m => ({ default: m.DelegationPage })));
const SchoolsListPage = React.lazy(() => StubPages.then(m => ({ default: m.SchoolsListPage })));
const SchoolDetailPage = React.lazy(() => StubPages.then(m => ({ default: m.SchoolDetailPage })));
const ReportsPage = React.lazy(() => StubPages.then(m => ({ default: m.ReportsPage })));
const DashboardsPage = React.lazy(() => StubPages.then(m => ({ default: m.DashboardsPage })));
const VacancyDashboard = React.lazy(() => import('../pages/reports/VacancyDashboard').then(m => ({ default: m.VacancyDashboard })));

const PostCensusForm = React.lazy(() => import('../pages/posts/PostCensusForm').then(m => ({ default: m.PostCensusForm })));
const CensusReviewPanel = React.lazy(() => import('../pages/posts/CensusReviewPanel').then(m => ({ default: m.CensusReviewPanel })));

const InfrastructureCensusForm = React.lazy(() => import('../pages/infrastructure/InfrastructureCensusForm').then(m => ({ default: m.default })));
const InfrastructureReviewPanel = React.lazy(() => import('../pages/infrastructure/InfrastructureReviewPanel').then(m => ({ default: m.default })));
const DeficiencyDashboard = React.lazy(() => import('../pages/reports/DeficiencyDashboard').then(m => ({ default: m.default })));

const StudentRegister = React.lazy(() => import('../pages/students/StudentRegister').then(m => ({ default: m.StudentRegister })));
const StudentProfileForm = React.lazy(() => import('../pages/students/StudentProfileForm').then(m => ({ default: m.StudentProfileForm })));
const StudentBulkImport = React.lazy(() => import('../pages/students/StudentBulkImport').then(m => ({ default: m.StudentBulkImport })));
const EnrollmentSubmissionForm = React.lazy(() => import('../pages/enrollment/EnrollmentSubmissionForm').then(m => ({ default: m.EnrollmentSubmissionForm })));
const EnrollmentReviewPanel = React.lazy(() => import('../pages/enrollment/EnrollmentReviewPanel').then(m => ({ default: m.EnrollmentReviewPanel })));
const EnrollmentDashboard = React.lazy(() => import('../pages/reports/EnrollmentDashboard').then(m => ({ default: m.EnrollmentDashboard })));

// S9.1 — School Portal, Employee Self-Service, ZEO Review
const SchoolDashboard = React.lazy(() => import('../pages/school/SchoolDashboard').then(m => ({ default: m.SchoolDashboard })));
const EmployeeSelfService = React.lazy(() => import('../pages/employee/EmployeeSelfService').then(m => ({ default: m.EmployeeSelfService })));
const EmployeeUpdateRequestForm = React.lazy(() => import('../pages/employee/EmployeeUpdateRequestForm').then(m => ({ default: m.EmployeeUpdateRequestForm })));
const ZeoReviewDashboard = React.lazy(() => import('../pages/zeo/ZeoReviewDashboard').then(m => ({ default: m.ZeoReviewDashboard })));

const NotificationsPage = React.lazy(() => StubPages.then(m => ({ default: m.NotificationsPage })));
const AdminSystemPage = React.lazy(() => StubPages.then(m => ({ default: m.AdminSystemPage })));
const NotFoundPage = React.lazy(() => StubPages.then(m => ({ default: m.NotFoundPage })));
const UnauthorizedPage = React.lazy(() => StubPages.then(m => ({ default: m.UnauthorizedPage })));

const router = createBrowserRouter([
  {
    path: ROUTES.LOGIN,
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      // Role-based default redirect
      // HOI/SCHOOL_HEAD → /school/dashboard
      // SCHOOL_EMPLOYEE/TEACHER → /employee/self-service
      // ZEO → /zeo/review
      // Others → work-queue
      { index: true, element: <Navigate to={ROUTES.WORK_QUEUE} replace /> },
      
      { path: 'work-queue', element: <Suspense fallback={<PageLoader />}><MyWorkQueuePage /></Suspense> },
      { path: 'section-queue', element: <Suspense fallback={<PageLoader />}><SectionQueuePage /></Suspense> },
      { path: 'office-inbox', element: <Suspense fallback={<PageLoader />}><OfficeInboxPage /></Suspense> },

      { path: 'orders', element: <Suspense fallback={<PageLoader />}><OrdersListPage /></Suspense> },
      { path: 'orders/create', element: <Suspense fallback={<PageLoader />}><OrderCreatePage /></Suspense> },
      { path: 'orders/:id', element: <Suspense fallback={<PageLoader />}><OrderDetailPage /></Suspense> },
      { path: 'circulars', element: <Suspense fallback={<PageLoader />}><OrdersListPage /></Suspense> },

      { path: 'cases', element: <Suspense fallback={<PageLoader />}><CasesListPage /></Suspense> },
      { path: 'cases/:id', element: <Suspense fallback={<PageLoader />}><CaseDetailPage /></Suspense> },
      { path: 'delegations', element: <Suspense fallback={<PageLoader />}><DelegationPage /></Suspense> },

      { path: 'employees', element: <Suspense fallback={<PageLoader />}><EmployeesListPage /></Suspense> },
      { path: 'employees/import', element: <Suspense fallback={<PageLoader />}><EmployeeBulkImportPage /></Suspense> },
      { path: 'employees/:id', element: <Suspense fallback={<PageLoader />}><EmployeeDetailPage /></Suspense> },
      { path: 'schools', element: <Suspense fallback={<PageLoader />}><SchoolsListPage /></Suspense> },
      { path: 'schools/:id', element: <Suspense fallback={<PageLoader />}><SchoolDetailPage /></Suspense> },

      { path: 'reports', element: <Suspense fallback={<PageLoader />}><ReportsPage /></Suspense> },
      { path: 'reports/vacancy', element: <Suspense fallback={<PageLoader />}><VacancyDashboard /></Suspense> },
      { path: 'reports/deficiency', element: <Suspense fallback={<PageLoader />}><DeficiencyDashboard /></Suspense> },
      { path: 'dashboards', element: <Suspense fallback={<PageLoader />}><DashboardsPage /></Suspense> },
      { path: 'notifications', element: <Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense> },
      
      { path: 'posts/census', element: <Suspense fallback={<PageLoader />}><PostCensusForm /></Suspense> },
      { path: 'posts/review', element: <Suspense fallback={<PageLoader />}><CensusReviewPanel /></Suspense> },
      
      { path: 'infrastructure/census', element: <Suspense fallback={<PageLoader />}><InfrastructureCensusForm /></Suspense> },
      { path: 'infrastructure/review', element: <Suspense fallback={<PageLoader />}><InfrastructureReviewPanel /></Suspense> },

      { path: 'students', element: <Suspense fallback={<PageLoader />}><StudentRegister /></Suspense> },
      { path: 'students/new', element: <Suspense fallback={<PageLoader />}><StudentProfileForm /></Suspense> },
      { path: 'students/import', element: <Suspense fallback={<PageLoader />}><StudentBulkImport /></Suspense> },
      { path: 'students/:id', element: <Suspense fallback={<PageLoader />}><StudentProfileForm /></Suspense> },
      { path: 'enrollment/submission', element: <Suspense fallback={<PageLoader />}><EnrollmentSubmissionForm /></Suspense> },
      { path: 'enrollment/review', element: <Suspense fallback={<PageLoader />}><EnrollmentReviewPanel /></Suspense> },
      { path: 'reports/enrollment', element: <Suspense fallback={<PageLoader />}><EnrollmentDashboard /></Suspense> },

      // S9.1 — School Portal, Employee Self-Service, ZEO Review
      { path: 'school/dashboard', element: <Suspense fallback={<PageLoader />}><SchoolDashboard /></Suspense> },
      { path: 'employee/self-service', element: <Suspense fallback={<PageLoader />}><EmployeeSelfService /></Suspense> },
      { path: 'employee/update-request', element: <Suspense fallback={<PageLoader />}><EmployeeUpdateRequestForm /></Suspense> },
      { path: 'zeo/review', element: <Suspense fallback={<PageLoader />}><ZeoReviewDashboard /></Suspense> },

      { 
        path: 'admin', 
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="organizations" replace /> },
          { path: 'organizations', element: <Suspense fallback={<PageLoader />}><AdminOrganizationsPage /></Suspense> },
          { path: 'hierarchy', element: <Suspense fallback={<PageLoader />}><AdminHierarchyPage /></Suspense> },
          { path: 'offices', element: <Suspense fallback={<PageLoader />}><AdminOfficesPage /></Suspense> },
          { path: 'sections', element: <Suspense fallback={<PageLoader />}><AdminSectionsPage /></Suspense> },
          { path: 'master-data', element: <Suspense fallback={<PageLoader />}><AdminMasterDataPage /></Suspense> },
          { path: 'users', element: <Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense> },
          { path: 'policies', element: <Suspense fallback={<PageLoader />}><AdminRolesPoliciesPage /></Suspense> },
          { path: 'assignments', element: <Suspense fallback={<PageLoader />}><AdminRoleAssignmentsPage /></Suspense> },
          { path: 'delegations', element: <Suspense fallback={<PageLoader />}><AdminDelegationsPage /></Suspense> },
          { path: 'responsibilities', element: <Suspense fallback={<PageLoader />}><AdminResponsibilitiesPage /></Suspense> },
          { path: 'workflows', element: <Suspense fallback={<PageLoader />}><AdminWorkflowsPage /></Suspense> },
          { path: 'posts', element: <Suspense fallback={<PageLoader />}><PostManagementGrid /></Suspense> },
          { path: 'system', element: <Suspense fallback={<PageLoader />}><AdminSystemPage /></Suspense> },
        ]
      },

      { path: '403', element: <Suspense fallback={<PageLoader />}><UnauthorizedPage /></Suspense> },
      { path: '404', element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense> },
      { path: '*', element: <Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense> },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
