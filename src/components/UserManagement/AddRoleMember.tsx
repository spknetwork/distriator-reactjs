import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import { type RoleModel, RoleType } from "../../types/role";
import { useRoleManagement } from "../../hooks/useRoleManagement";
import { CountriesDropdown } from "./CountriesDropdown";
import CommonLayout from "../CommonLayout";
import { useAuthData } from '../../utils/auth-utils';

export const AddRoleMember: React.FC = () => {
  const { roleType, username } = useParams<{
    roleType: string;
    username?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState<RoleModel>({
    username: "",
    banned: false,
    city: "",
    country: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const { token, type: userRoleType } = useAuthData();
  const roleTypeEnum = roleType as RoleType;
  const isEdit = !!username;

  // Check if user has admin or super admin access
  const hasAccess = userRoleType === RoleType.ADMIN || userRoleType === RoleType.SUPER;

  // Redirect non-admin users to home
  useEffect(() => {
    if (!hasAccess && token) {
      navigate("/");
    }
  }, [hasAccess, token, navigate]);

  const { addMember, updateMember, getRoleName } = useRoleManagement(
    token,
    roleTypeEnum
  );

  useEffect(() => {
    if (isEdit && location.state?.role) {
      const role = location.state.role as RoleModel;
      setFormData(role);
    }
  }, [isEdit, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      toast.error("Enter username");
      return;
    }

    if (roleTypeEnum === RoleType.GUIDE) {
      if (!formData.country) {
        toast.error("Select country");
        return;
      }
      if (!formData.city?.trim()) {
        toast.error("Enter city");
        return;
      }
    }

    setIsLoading(true);

    try {
      let success;
      if (isEdit) {
        success = await updateMember(formData);
      } else {
        success = await addMember(formData);
      }

      if (success) {
        navigate(`/manage-users/${roleType}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof RoleModel, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "username") {
      setAvatarError(false); // reset avatar error if username changes
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
              You don't have permission to access this page. Only Admin and Super Admin users can manage users.
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
              onClick={() => navigate(`/manage-users/${roleType}`)}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isEdit ? "Edit" : "Add"} {getRoleName()}
              </h1>
              <p className="text-muted-foreground">
                {isEdit ? "Update" : "Add a new"} {getRoleName().toLowerCase()}{" "}
                to the system
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
                  {!avatarError && formData.username ? (
                    <img
                      src={`https://images.hive.blog/u/${formData.username}/avatar`}
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
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder="Enter username"
                  disabled={isEdit}
                  className="w-full pl-14 pr-4 py-3 
                 bg-gray-900 border border-gray-700 
                 rounded-lg text-gray-100 
                 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Guide-specific fields */}
            {roleTypeEnum === RoleType.GUIDE && (
              <>
                {/* Country Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">
                    Country
                  </label>
                  <CountriesDropdown
                    value={formData.country || ""} // Pass the selected country
                    onChange={(value) => handleInputChange("country", value)}
                  />
                </div>

                {/* City Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-200">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Enter the city"
                    className="w-full px-4 py-3 
               bg-gray-900 border border-gray-700 
               rounded-lg text-gray-100 
               placeholder-gray-500"
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(`/manage-users/${roleType}`)}
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
                {isEdit ? "Update" : "Add"} {getRoleName()}
              </button>
            </div>
          </form>
        </div>
      </div>
    </CommonLayout>
  );
};
