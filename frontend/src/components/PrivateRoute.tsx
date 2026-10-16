import { Navigate } from "react-router-dom";
import BaseUrl from "@/consts/baseUrl";
import Loading from "@/components/ui/loading";
import { useAuth } from "@/providers/AuthenticationProvider";

const PrivateRoute = (props: { children: any }) => {
  const auth = useAuth();

  //! Render
  // Session is still being restored from the refresh cookie: wait instead of bouncing to /login
  if (auth.loading) {
    return (
      <div className="p-2" role="status" aria-label="Đang tải">
        <Loading />
      </div>
    );
  }

  if (auth.isLogged) {
    return props.children;
  }

  return <Navigate to={BaseUrl.Login} replace />;
};

export default PrivateRoute;
