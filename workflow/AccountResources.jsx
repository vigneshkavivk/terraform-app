// src/components/workflow/AccountResources.jsx
import React, { useState, useEffect } from 'react';
import { Code, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccountResources = ({ selectedAccount, selectedProvider, onCreateNewResource }) => {
  const [deployments, setDeployments] = useState([]);
  const [loadingDeployments, setLoadingDeployments] = useState(true);
  const [errorDeployments, setErrorDeployments] = useState(null);
  const [selectedDeployment, setSelectedDeployment] = useState(null); // for modal
  const navigate = useNavigate();

  // ✅ Destroy handler
  const handleDestroyDeployment = async (deploymentId) => {
    if (!window.confirm(
      `⚠️ Destroy entire deployment?\nID: ${deploymentId}\nThis runs \`terraform destroy\` and cannot be undone.`)) {
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await fetch('/api/terraform/destroy-deployment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ deploymentId })
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Destroyed: ${deploymentId}`);
        setDeployments(prev => prev.filter(d => d.deploymentId !== deploymentId));
        setSelectedDeployment(null); // Close modal if open
      } else {
        alert(`❌ Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  // ✅ Fetch Terraform deployments for this account
  useEffect(() => {
    if (!selectedAccount || selectedProvider !== 'aws') {
      setLoadingDeployments(false);
      return;
    }

    const fetchDeployments = async () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('Not logged in');
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      localStorage.removeItem('user');
      throw new Error('Invalid session. Please log in again.');
    }

    const token = (user?.token || '').trim();
    if (!token || token === 'undefined' || token === 'null') {
      localStorage.removeItem('user');
      throw new Error('Session expired. Please log in again.');
    }

    const res = await fetch(`/api/terraform/resources?accountId=${selectedAccount._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      // Token rejected by server
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data.success) {
      const filtered = (data.deployments || []).filter(
        dep => dep.accountId === selectedAccount._id?.toString()
      );
      setDeployments(filtered);
    } else {
      setErrorDeployments(data.error || 'Failed to load deployments');
    }
  } catch (err) {
    console.error('Fetch deployments error:', err);
    setErrorDeployments(err.message || 'Failed to load deployments');
  } finally {
    setLoadingDeployments(false);
  }
};

    setLoadingDeployments(true);
    fetchDeployments();
  }, [selectedAccount, selectedProvider]);

  // ✅ Render UI
  return (
    <div className="space-y-6">
      {/* ✅ TERRAFORM DEPLOYMENTS HEADING */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <Code className="text-green-400" /> Terraform Deployments
        </h3>
        <div className="text-sm text-gray-400 italic mb-3">
          These are the Terraform deployments created for this AWS account.
        </div>

        {loadingDeployments ? (
          <div className="text-gray-500">Loading deployments...</div>
        ) : errorDeployments ? (
          <div className="text-red-400 text-sm">⚠️ {errorDeployments}</div>
        ) : deployments && deployments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {deployments.map((dep) => (
              <div
                key={dep.deploymentId}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-3 cursor-pointer hover:bg-gray-800/70 transition"
                onClick={() => setSelectedDeployment(dep)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-cyan-300 text-xs truncate">{dep.deploymentId}</div>
                    <div className="text-xs text-gray-400 mt-1 truncate">
                      {dep.modules.map(m => m.toUpperCase()).join(', ')}
                    </div>
                    {dep.resources && dep.resources.length > 0 && (
                      <div className="text-xs mt-1">
                        <span className="text-green-400">✓ {dep.resources.length} resource(s)</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDestroyDeployment(dep.deploymentId);
                    }}
                    className="text-red-400 hover:text-red-300 text-xs font-medium bg-red-900/20 px-2 py-1 rounded flex items-center gap-1"
                    title="Destroy entire deployment via Terraform"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-block p-4 bg-gray-800/50 border border-dashed border-gray-600 rounded-xl mb-4">
              <Code className="text-gray-500 w-8 h-8 mx-auto" />
            </div>
            <h4 className="text-gray-300 font-medium mb-1">No Terraform deployments yet</h4>
            <p className="text-gray-500 text-sm mb-4">Create your first infrastructure with CloudMaSa</p>
          </div>
        )}
      </div>

      <button
      onClick={onCreateNewResource || (() => console.warn('onCreateNewResource not provided'))}
      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition"
    >
      ➕ Create New Resource
    </button>

      {/* ✅ MODAL FOR DEPLOYMENT DETAILS */}
      {selectedDeployment && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-white">Deployment Details</h4>
              <button
                onClick={() => setSelectedDeployment(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-gray-800 rounded">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">ID:</span>
                  <span className="font-mono text-cyan-300">{selectedDeployment.deploymentId}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-800 rounded">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Modules:</span>
                  <span className="text-yellow-400">{selectedDeployment.modules.join(', ')}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-800 rounded">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-blue-400">{new Date(selectedDeployment.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-3 bg-gray-800 rounded">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Resources:</span>
                  <span className="text-green-400">✓ {selectedDeployment.resources?.length || 0}</span>
                </div>
              </div>

              {selectedDeployment.resources?.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Resource List:</h5>
                  <div className="space-y-2">
                    {selectedDeployment.resources.slice(0, 5).map((r, i) => (
                      <div key={i} className="p-2 bg-gray-800 rounded text-xs">
                        <div className="flex justify-between">
                          <span>{r.name || r.id}</span>
                          <span className="text-gray-500">{r.type}</span>
                        </div>
                      </div>
                    ))}
                    {selectedDeployment.resources.length > 5 && (
                      <div className="text-xs text-gray-500 mt-1">
                        +{selectedDeployment.resources.length - 5} more...
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-gray-700 mt-4">
                <button
                  onClick={() => handleDestroyDeployment(selectedDeployment.deploymentId)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm"
                >
                  🗑️ Destroy Deployment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {selectedAccount && (
        <div className="text-center mt-6 text-gray-500 text-sm">
          🔍 Scanned: <span className="font-mono">{selectedAccount.accountId}</span> in <span className="font-mono">{selectedAccount.awsRegion}</span>
        </div>
      )}
    </div>
  );
};

export default AccountResources;
