// src/components/workflow/ConnectionForm.jsx
import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Globe,
  Link,
  Eye,
  EyeOff,
  CheckCircle,
  Cloud,
} from 'lucide-react';

const API_BASE = 'http://localhost:3000';

const ConnectionForm = ({
  selectedProvider,
  formData,
  setFormData,
  connectedAccounts,
  selectedAccount,
  setSelectedAccount,
  usingExistingAccount,
  setUsingExistingAccount,
  onValidate,
  onConnect,
  responseMessage,
  formValid,
}) => {
  const [showSecret, setShowSecret] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const provider = { aws: true, gcp: true, azure: true }[selectedProvider];

  const formFields = {
    aws: (
      <>
        {connectedAccounts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Cloud className="mr-2 text-orange-400" /> Connected Accounts
            </h3>
            <select
              value={selectedAccount ? selectedAccount._id : ""}
              onChange={(e) => {
                if (e.target.value === "") {
                  setSelectedAccount(null);
                  setUsingExistingAccount(false);
                } else {
                  const selected = connectedAccounts.find(acc => acc._id === e.target.value);
                  if (selected) {
                    setSelectedAccount(selected);
                    setFormData({ ...formData, region: selected.awsRegion });
                    setUsingExistingAccount(true);
                  }
                }
              }}
              className="w-full bg-[#1E2633] border border-[#3a5b9b] text-white rounded-md p-3"
            >
              <option value="">-- Select an Account --</option>
              {connectedAccounts.map((account) => (
                <option key={account._id} value={account._id}>
                  Account: {account.accountId} (Region: {account.awsRegion})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">Select an existing AWS account to use.</p>
          </div>
        )}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 flex items-center">
            <Lock className="mr-2 text-orange-400" size={16} /> AWS Access Key
          </label>
          <div className="relative">
            <input
              type="text"
              name="accessKey"
              value={formData.accessKey}
              onChange={handleChange}
              disabled={usingExistingAccount}
              className={`w-full bg-[#1E2633] border border-[#3a5b9b] text-white rounded-md p-3 ${
                usingExistingAccount ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              required={!usingExistingAccount}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">Enter your AWS Access Key ID from your IAM credentials.</p>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 flex items-center">
            <Lock className="mr-2 text-orange-400" size={16} /> AWS Secret Key
          </label>
          <div className="relative">
            <input
              type={showSecret ? "text" : "password"}
              name="secretKey"
              value={formData.secretKey}
              onChange={handleChange}
              disabled={usingExistingAccount}
              className={`w-full bg-[#1E2633] border border-[#3a5b9b] text-white rounded-md p-3 ${
                usingExistingAccount ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              required={!usingExistingAccount}
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-3 text-gray-400 hover:text-orange-400"
            >
              {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">Enter your AWS Secret Access Key from your IAM credentials.</p>
        </div>
      </>
    ),
    gcp: (
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Lock className="mr-2 text-blue-400" size={16} /> Service Account JSON
        </h3>
        <textarea
          name="serviceAccountJson"
          value={formData.serviceAccountJson}
          onChange={handleChange}
          placeholder="Paste your GCP service account JSON here..."
          rows="6"
          className="w-full bg-[#1E2633] border border-[#3a5b9b] text-white rounded-md p-3"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Paste the entire JSON file content from your GCP service account key.
        </p>
      </div>
    ),
    azure: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center">
            <Lock className="mr-2 text-blue-400" size={16} /> Tenant ID
          </label>
          <input
            type="text"
            name="tenantId"
            value={formData.tenantId}
            onChange={handleChange}
            className="w-full bg-[#1E2633] border border-[#3a5b9b] rounded-md p-3"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center">
            <Lock className="mr-2 text-blue-400" size={16} /> Client ID
          </label>
          <input
            type="text"
            name="clientId"
            value={formData.clientId}
            onChange={handleChange}
            className="w-full bg-[#1E2633] border border-[#3a5b9b] rounded-md p-3"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center">
            <Lock className="mr-2 text-blue-400" size={16} /> Client Secret
          </label>
          <input
            type="password"
            name="clientSecret"
            value={formData.clientSecret}
            onChange={handleChange}
            className="w-full bg-[#1E2633] border border-[#3a5b9b] rounded-md p-3"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 flex items-center">
            <Lock className="mr-2 text-blue-400" size={16} /> Subscription ID
          </label>
          <input
            type="text"
            name="subscriptionId"
            value={formData.subscriptionId}
            onChange={handleChange}
            className="w-full bg-[#1E2633] border border-[#3a5b9b] rounded-md p-3"
            required
          />
        </div>
      </div>
    ),
  };

  const regions = {
    aws: ["us-east-1", "us-west-2", "eu-central-1", "ap-southeast-1"],
    gcp: ["us-central1", "europe-west1", "asia-east1", "australia-southeast1"],
    azure: ["eastus", "westeurope", "southeastasia", "brazilsouth"],
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <KeyRound className="mr-2 text-orange-400" /> {selectedProvider.toUpperCase()} Credentials
      </h2>
      {formFields[selectedProvider]}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 flex items-center">
          <Globe className="mr-2 text-orange-400" size={16} /> Region
        </label>
        <select
          name="region"
          value={formData.region}
          onChange={handleChange}
          disabled={usingExistingAccount}
          className={`w-full bg-[#1E2633] border border-[#3a5b9b] text-white rounded-md p-3 ${
            usingExistingAccount ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {regions[selectedProvider].map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Select the region where your resources will be deployed.
          {usingExistingAccount && " (Disabled because an existing account is selected)"}
        </p>
      </div>
      <div className="flex items-center mt-6 gap-3">
        {selectedProvider === "aws" && (
          <>
            <button
              type="button"
              onClick={onValidate}
              disabled={usingExistingAccount}
              className={`flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded transition ${
                usingExistingAccount ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Link size={16} /> Test Connection
            </button>
            {formData.accessKey && formData.secretKey && !usingExistingAccount && (
              <button
                type="button"
                onClick={onConnect}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded transition"
              >
                <CheckCircle size={16} /> Connect Account
              </button>
            )}
          </>
        )}
        {responseMessage && <span className="ml-3 text-sm text-green-400">{responseMessage}</span>}
      </div>
    </div>
  );
};

export default ConnectionForm;
