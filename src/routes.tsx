import { Navigate, Outlet, useParams, type RouteObject } from 'react-router';
import { PhoneDetail } from './phone-detail/PhoneDetail';
import { PhoneList } from './phone-list/PhoneList';

function Layout() {
  return (
    <div className="view-container">
      <div className="view-frame">
        <Outlet />
      </div>
    </div>
  );
}

function PhoneDetailRoute() {
  const { phoneId = '' } = useParams();
  // A new key per phone resets the component's state, as ngView used to.
  return <PhoneDetail key={phoneId} phoneId={phoneId} />;
}

/** Same URLs as the AngularJS app, without the "#!". Anything else goes to the list, as before. */
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: 'phones', element: <PhoneList /> },
      { path: 'phones/:phoneId', element: <PhoneDetailRoute /> },
      { path: '*', element: <Navigate to="/phones" replace /> },
    ],
  },
];
