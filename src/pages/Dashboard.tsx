/* eslint-disable @typescript-eslint/no-explicit-any */
import CommonLayout from "../components/CommonLayout";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { UserClaimResponseDTO } from "../types/claim";
import { ClaimScreen } from "../components/ClaimScreen";
import { useAuthData } from '../utils/auth-utils';

const Dashboard = () => {
  const { currentUser, token, username } = useAuthData();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    
    if (!token) {
      return;
    }

  }, [currentUser, token, navigate]);

  if (!token) {
    return (
      <CommonLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Please Login</h2>
            <p className="text-muted-foreground">You need to login to access the dashboard</p>
          </div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <ClaimScreen
      token={token}
      username={username}
      onClaimNow={(business: any, claimData: UserClaimResponseDTO) => {
        navigate("/photo-upload", { state: { business, claimData } });
      }}
    />
  );
};

export default Dashboard;