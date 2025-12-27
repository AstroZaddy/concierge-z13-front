import { useState, useEffect } from "react";
import { Star, Trash2 } from "lucide-react";
import { NeonButton } from "../ui/NeonButton";
import { Modal } from "../ui/Modal";
import { API_BASE_URL } from "../../utils/constants";
import { LoadingState } from "../ui/LoadingState";
import { ErrorState } from "../ui/ErrorState";

export function AccountPageContent() {
  // Since this component is loaded as a React island with client:load,
  // we can't reliably access SessionBootstrap context, so we fetch data directly
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showSetDefaultModal, setShowSetDefaultModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  
  // Selected chart for operations
  const [selectedChart, setSelectedChart] = useState(null);
  
  // Form states
  const [newChartName, setNewChartName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Operation states
  const [processing, setProcessing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Fetch charts on mount
  useEffect(() => {
    fetchCharts();
  }, []);

  const fetchCharts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/charts`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch charts");
      }

      const data = await response.json();
      setCharts(data.charts || []);
    } catch (err) {
      console.error("Error fetching charts:", err);
      setError("Failed to load charts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = (chart) => {
    setSelectedChart(chart);
    setShowSetDefaultModal(true);
  };

  const confirmSetDefault = async () => {
    if (!selectedChart) return;
    
    try {
      setProcessing(true);
      const response = await fetch(`${API_BASE_URL}/charts/${selectedChart.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          set_as_default: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to set default chart");
      }

      // Refresh charts list
      await fetchCharts();
      
      setShowSetDefaultModal(false);
      setSelectedChart(null);
    } catch (err) {
      console.error("Error setting default chart:", err);
      alert("Failed to set default chart. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = (chart) => {
    setSelectedChart(chart);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedChart) return;
    
    try {
      setProcessing(true);
      const response = await fetch(`${API_BASE_URL}/charts/${selectedChart.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete chart");
      }

      // Refresh charts list
      await fetchCharts();
      
      setShowDeleteModal(false);
      setSelectedChart(null);
    } catch (err) {
      console.error("Error deleting chart:", err);
      alert("Failed to delete chart. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleChangeName = (chart) => {
    setSelectedChart(chart);
    setNewChartName(chart.name || "");
    setShowChangeNameModal(true);
  };

  const confirmChangeName = async () => {
    if (!selectedChart || !newChartName.trim()) {
      alert("Please enter a chart name.");
      return;
    }
    
    try {
      setProcessing(true);
      const response = await fetch(`${API_BASE_URL}/charts/${selectedChart.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newChartName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update chart name");
      }

      // Refresh charts list
      await fetchCharts();
      
      setShowChangeNameModal(false);
      setSelectedChart(null);
      setNewChartName("");
    } catch (err) {
      console.error("Error updating chart name:", err);
      alert("Failed to update chart name. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowChangePasswordModal(true);
  };

  const confirmChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters long.");
      return;
    }
    
    try {
      setProcessing(true);
      const response = await fetch(`${API_BASE_URL}/auth/password`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to change password");
      }

      alert("Password changed successfully!");
      setShowChangePasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Error changing password:", err);
      alert(err.message || "Failed to change password. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      // Redirect to landing page
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
      // Still redirect to landing page even on error
      window.location.href = "/";
    }
  };

  return (
    <section className="min-h-screen px-4 pt-32 pb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-8">
          <span className="gradient-text">Account Management</span>
        </h1>
        
        {/* Saved Charts List */}
        <div className="mb-8 p-8 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">Saved Charts</h2>
          
          {loading ? (
            <p className="text-gray-400">Loading charts...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : charts.length === 0 ? (
            <p className="text-gray-400">No saved charts yet.</p>
          ) : (
            <div className="space-y-4">
              {charts.map((chart) => (
                <div
                  key={chart.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-gray-700/30 hover:border-gray-600/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-100 mb-1">
                      {chart.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Created: {new Date(chart.created_at).toLocaleDateString()}
                      {chart.is_default && (
                        <span className="ml-2 text-neon-cyan">(Default)</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Star icon for default */}
                    <button
                      onClick={() => handleSetDefault(chart)}
                      className={`p-2 rounded-lg transition-colors ${
                        chart.is_default
                          ? "text-yellow-400 hover:text-yellow-300"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                      aria-label={chart.is_default ? "Default chart" : "Set as default"}
                      title={chart.is_default ? "Default chart" : "Set as default"}
                    >
                      <Star
                        size={20}
                        fill={chart.is_default ? "currentColor" : "none"}
                      />
                    </button>
                    
                    {/* Trash icon for delete */}
                    <button
                      onClick={() => handleDelete(chart)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                      aria-label="Delete chart"
                      title="Delete chart"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account Actions */}
        <div className="mb-8 p-8 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-100 mb-6">Account Settings</h2>
          
          <div className="space-y-4">
            {/* Change Chart Name - Show dropdown if multiple charts */}
            {charts.length > 0 && (
              <div className="p-4 rounded-lg bg-white/5 border border-gray-700/30">
                <h3 className="text-lg font-semibold text-gray-100 mb-2">
                  Chart Name
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Change the name of a saved chart
                </p>
                {charts.length === 1 ? (
                  <button
                    onClick={() => handleChangeName(charts[0])}
                    className="px-4 py-2 rounded-lg bg-neon-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                  >
                    Change Chart Name
                  </button>
                ) : (
                  <div className="space-y-2">
                    {charts.map((chart) => (
                      <div
                        key={chart.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-gray-700/20"
                      >
                        <span className="text-gray-200">{chart.name}</span>
                        <button
                          onClick={() => handleChangeName(chart)}
                          className="px-3 py-1 text-sm rounded-lg bg-neon-gradient text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                          Rename
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Change Password Button */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-gray-700/30">
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-1">
                  Password
                </h3>
                <p className="text-sm text-gray-400">
                  Update your account password
                </p>
              </div>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 rounded-lg bg-neon-gradient text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-8 rounded-xl bg-white/5 border border-gray-700/40 backdrop-blur-sm">
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-6 py-3 rounded-full font-semibold text-white bg-neon-gradient shadow-neon hover:shadow-neon-magenta hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>

      {/* Set Default Chart Modal */}
      <Modal
        isOpen={showSetDefaultModal}
        onClose={() => {
          setShowSetDefaultModal(false);
          setSelectedChart(null);
        }}
        title="Set Default Chart"
      >
        <div className="space-y-4">
          <p className="text-gray-200">
            Are you sure you want to make <span className="font-semibold text-neon-cyan">{selectedChart?.name}</span> your default chart?
          </p>
          <div className="flex gap-3 justify-end">
            <NeonButton
              onClick={() => {
                setShowSetDefaultModal(false);
                setSelectedChart(null);
              }}
              className="px-4 py-2"
            >
              Cancel
            </NeonButton>
            <NeonButton
              onClick={confirmSetDefault}
              disabled={processing}
              className="px-4 py-2"
            >
              {processing ? "Setting..." : "Confirm"}
            </NeonButton>
          </div>
        </div>
      </Modal>

      {/* Delete Chart Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedChart(null);
        }}
        title="Delete Chart"
      >
        <div className="space-y-4">
          <p className="text-gray-200">
            Are you sure you want to remove the chart for <span className="font-semibold text-neon-cyan">{selectedChart?.name}</span>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <NeonButton
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedChart(null);
              }}
              className="px-4 py-2"
            >
              Cancel
            </NeonButton>
            <NeonButton
              onClick={confirmDelete}
              disabled={processing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700"
            >
              {processing ? "Deleting..." : "Confirm"}
            </NeonButton>
          </div>
        </div>
      </Modal>

      {/* Change Chart Name Modal */}
      <Modal
        isOpen={showChangeNameModal}
        onClose={() => {
          setShowChangeNameModal(false);
          setSelectedChart(null);
          setNewChartName("");
        }}
        title="Change Chart Name"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Chart Name
            </label>
            <input
              type="text"
              value={newChartName}
              onChange={(e) => setNewChartName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
              placeholder="Enter chart name"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <NeonButton
              onClick={() => {
                setShowChangeNameModal(false);
                setSelectedChart(null);
                setNewChartName("");
              }}
              className="px-4 py-2"
            >
              Cancel
            </NeonButton>
            <NeonButton
              onClick={confirmChangeName}
              disabled={processing || !newChartName.trim()}
              className="px-4 py-2"
            >
              {processing ? "Saving..." : "Confirm"}
            </NeonButton>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}
        title="Change Password"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/5 border border-gray-700/40 text-gray-200 focus:outline-none focus:border-neon-cyan transition"
              placeholder="Confirm new password"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <NeonButton
              onClick={() => {
                setShowChangePasswordModal(false);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="px-4 py-2"
            >
              Cancel
            </NeonButton>
            <NeonButton
              onClick={confirmChangePassword}
              disabled={processing || !currentPassword || !newPassword || !confirmPassword}
              className="px-4 py-2"
            >
              {processing ? "Changing..." : "Confirm"}
            </NeonButton>
          </div>
        </div>
      </Modal>
    </section>
  );
}
