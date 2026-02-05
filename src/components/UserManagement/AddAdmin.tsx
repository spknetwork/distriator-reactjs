import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import { useAdminManagement } from "../../hooks/useAdminManagement";
import CommonLayout from "../CommonLayout";
import { useAuthData } from "../../utils/auth-utils";
import { RoleType } from "../../types/role";

export const AddAdmin: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const { token, type: userRoleType } = useAuthData();

  const hasAccess = userRoleType === RoleType.SUPER;

  useEffect(() => {
    if (!hasAccess && token) {
      navigate("/");
    }
  }, [hasAccess, token, navigate]);

  const { addAdmin } = useAdminManagement(token, hasAccess);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast.error("Enter username");
      return;
    }

    setIsLoading(true);

    try {
      const success = await addAdmin(username.trim());

      if (success) {
        navigate("/manage-admins");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <CommonLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to access this page
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary"
            >
              Go to Home
            </button>
          </div>
        </div>
      </CommonLayout>
    );
  }

  if (!hasAccess) {
    return (
      <CommonLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Access Denied
            </h2>
            <p className="text-muted-foreground mb-6">
              You don&apos;t have permission to access this page. Only Super Admin
              users can add admins.
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary"
            >
              Go to Home
            </button>
          </div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate("/manage-admins")}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Add Admin
              </h1>
              <p className="text-muted-foreground">
                Add a new admin to the system
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-200">
                Username
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  {!avatarError && username ? (
                    <img
                      src={`https://images.hive.blog/u/${username}/avatar`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setAvatarError(false);
                  }}
                  placeholder="Enter Hive username"
                  className="w-full pl-14 pr-4 py-3 
                 bg-gray-900 border border-gray-700 
                 rounded-lg text-gray-100 
                 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/manage-admins")}
                className="px-6 py-3 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                )}
                Add Admin
              </button>
            </div>
          </form>
        </div>
      </div>
    </CommonLayout>
  );
};
