// src/components/workflow/ModuleConfigForm.jsx
import React from 'react';
import {
  Server,
  Database,
  Network,
  HardDrive,
  Code,
  Terminal,
  Globe,
  Lock,
} from 'lucide-react';

const ModuleConfigForm = ({ provider, moduleId, config, onConfigChange, vpcs = [] }) => {
  const updateConfig = (field, value) => {
    onConfigChange({ ...config, [field]: value });
  };

  return (
    <div className="bg-[#1E2633] p-4 rounded-lg border border-[#3a5b9b] mb-4">
      <h3 className="text-lg font-medium mb-3 flex items-center">
        <span className="mr-2">
          {moduleId === "ec2" && <Server className="text-orange-400" />}
          {moduleId === "s3" && <HardDrive className="text-yellow-400" />}
          {moduleId === "vpc" && <Network className="text-green-400" />}
          {moduleId === "eks" && <Database className="text-blue-400" />}
          {moduleId === "lambda" && <Code className="text-purple-400" />}
          {moduleId === "dynamodb" && <Database className="text-blue-400" />}
          {moduleId === "cloudfront" && <Globe className="text-teal-400" />}
          {moduleId === "iam" && <Lock className="text-gray-400" />}
          {moduleId === "sns" && <Terminal className="text-pink-400" />}
          {moduleId === "ecr" && <HardDrive className="text-blue-400" />}
        </span>
        Configure {moduleId.toUpperCase()}
      </h3>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Resource Name *</label>
        <input
          type="text"
          value={config.name || ""}
          onChange={(e) => updateConfig("name", e.target.value)}
          placeholder={`Enter ${moduleId} name`}
          className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
        />
      </div>

      {/* ===== AWS-SPECIFIC CONFIGS ===== */}
      {moduleId === "ec2" && provider === "aws" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Instance Type</label>
            <select
              value={config.instanceType || "t2.micro"}
              onChange={(e) => updateConfig("instanceType", e.target.value)}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value="t2.micro">t2.micro</option>
              <option value="t2.small">t2.small</option>
              <option value="t2.medium">t2.medium</option>
              <option value="m5.large">m5.large</option>
              <option value="t3.medium">t3.medium</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">AMI ID</label>
            <input
              type="text"
              value={config.amiId || ""}
              onChange={(e) => updateConfig("amiId", e.target.value)}
              placeholder="ami-0abcdef1234567890"
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">VPC</label>
            <select
              value={config.vpcId || ""}
              onChange={(e) => updateConfig("vpcId", e.target.value)}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value="">-- Select VPC --</option>
              <option value="default">Use Default VPC</option>
              {vpcs.map((vpc) => (
                <option key={vpc.id} value={vpc.id}>
                  {vpc.name || vpc.id} (CIDR: {vpc.cidrBlock})
                </option>
              ))}
              <option value="use-selected-vpc">Use Selected VPC Module</option>
            </select>
          </div>

          {(config.vpcId && config.vpcId !== "default" && config.vpcId !== "use-selected-vpc") && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Subnet</label>
                <select
                  value={config.subnetId || ""}
                  onChange={(e) => updateConfig("subnetId", e.target.value)}
                  className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
                >
                  <option value="">-- Select Subnet --</option>
                  {vpcs
                    .filter((vpc) => vpc.id === config.vpcId)
                    .flatMap((vpc) => vpc.subnets || [])
                    .map((subnet) => (
                      <option key={subnet.id} value={subnet.id}>
                        {subnet.name || subnet.id} (AZ: {subnet.availabilityZone})
                      </option>
                    ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Security Group</label>
                <select
                  value={config.securityGroupId || ""}
                  onChange={(e) => updateConfig("securityGroupId", e.target.value)}
                  className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
                >
                  <option value="">-- Select Security Group --</option>
                  {vpcs
                    .filter((vpc) => vpc.id === config.vpcId)
                    .flatMap((vpc) => vpc.securityGroups || [])
                    .map((sg) => (
                      <option key={sg.id} value={sg.id}>
                        {sg.name || sg.id}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">SSH Key Pair</label>
            <input
              type="text"
              value={config.keyName || ""}
              onChange={(e) => updateConfig("keyName", e.target.value)}
              placeholder="my-key"
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Must be an existing key pair.</p>
          </div>
        </>
      )}

      {moduleId === "s3" && provider === "aws" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Storage Class</label>
          <select
            value={config.storageClass || "STANDARD"}
            onChange={(e) => updateConfig("storageClass", e.target.value)}
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
          >
            <option value="STANDARD">Standard</option>
            <option value="INTELLIGENT_TIERING">Intelligent Tiering</option>
            <option value="GLACIER">Glacier</option>
          </select>
        </div>
      )}

      {moduleId === "vpc" && provider === "aws" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">CIDR Block</label>
            <input
              type="text"
              value={config.cidrBlock || "10.0.0.0/16"}
              onChange={(e) => updateConfig("cidrBlock", e.target.value)}
              placeholder="10.0.0.0/16"
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Subnet Count</label>
            <select
              value={config.subnetCount || 2}
              onChange={(e) => updateConfig("subnetCount", parseInt(e.target.value))}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
        </>
      )}

      {moduleId === "cloudtrail" && provider === "aws" && (
      <div className="space-y-4">
        <div>
          <label className="block text-orange-400 font-medium text-sm mb-1">
            Trail Name *
          </label>
          <input
            type="text"
            value={config.trailName || ""}
            onChange={(e) => updateConfig("trailName", e.target.value)}
            placeholder="my-cloudtrail"
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={config.isMultiRegionTrail !== false}
            onChange={(e) => updateConfig("isMultiRegionTrail", e.target.checked)}
            className="mt-0.5 w-4 h-4 text-orange-500 rounded border-gray-500 bg-[#2A4C83] focus:ring-orange-500"
          />
          <div>
            <label className="text-orange-400 font-medium text-sm">
              Multi-Region Trail
            </label>
            <p className="text-xs text-gray-400">Log activity in all AWS regions.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={config.enableLogFileValidation || false}
            onChange={(e) => updateConfig("enableLogFileValidation", e.target.checked)}
            className="mt-0.5 w-4 h-4 text-orange-500 rounded border-gray-500 bg-[#2A4C83] focus:ring-orange-500"
          />
          <div>
            <label className="text-orange-400 font-medium text-sm">
              Enable Log File Validation
            </label>
            <p className="text-xs text-gray-400">Creates signed digest files for integrity verification.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={config.includeGlobalServiceEvents !== false}
            onChange={(e) => updateConfig("includeGlobalServiceEvents", e.target.checked)}
            className="mt-0.5 w-4 h-4 text-orange-500 rounded border-gray-500 bg-[#2A4C83] focus:ring-orange-500"
          />
          <div>
            <label className="text-orange-400 font-medium text-sm">
              Include Global Service Events
            </label>
            <p className="text-xs text-gray-400">Log IAM, STS, and other global service activity.</p>
          </div>
        </div>

        <div>
          <label className="block text-orange-400 font-medium text-sm mb-1">
            S3 Bucket Name (Optional)
          </label>
          <input
            type="text"
            value={config.s3BucketName || ""}
            onChange={(e) => updateConfig("s3BucketName", e.target.value)}
            placeholder="Leave empty to auto-create"
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-teal-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            If blank, a secure bucket will be created automatically.
          </p>
        </div>
      </div>
    )}

    {moduleId === "iam" && provider === "aws" && (
  <>
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Resource Type</label>
      <div className="flex space-x-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="iamType"
            checked={config.create_user === true}
            onChange={() => updateConfig("create_user", true)}
            className="mr-2"
          />
          User
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            name="iamType"
            checked={config.create_role === true}
            onChange={() => updateConfig("create_role", true)}
            className="mr-2"
          />
          Role
        </label>
      </div>
    </div>

    {/* User Configuration */}
    {config.create_user && (
      <div className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">User Name *</label>
          <input
            type="text"
            value={config.user_name || ""}
            onChange={(e) => updateConfig("user_name", e.target.value)}
            placeholder="my-user"
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">User Path</label>
          <input
            type="text"
            value={config.user_path || "/"}
            onChange={(e) => updateConfig("user_path", e.target.value)}
            placeholder="/path/to/user/"
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
          />
        </div>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={config.create_access_key !== false}
            onChange={(e) => updateConfig("create_access_key", e.target.checked)}
            className="mt-0.5 w-4 h-4 text-orange-500 rounded border-gray-500 bg-[#2A4C83] focus:ring-orange-500"
          />
          <div>
            <label className="text-orange-400 font-medium text-sm">
              Create Access Key
            </label>
            <p className="text-xs text-gray-400">Generate an access key pair for this user.</p>
          </div>
        </div>
      </div>
    )}

    {/* Role Configuration */}
    {config.create_role && (
      <div className="space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Role Name *</label>
          <input
            type="text"
            value={config.role_name || ""}
            onChange={(e) => updateConfig("role_name", e.target.value)}
            placeholder="my-role"
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Role Path</label>
          <input
            type="text"
            value={config.role_path || "/"}
            onChange={(e) => updateConfig("role_path", e.target.value)}
            placeholder="/path/to/role/"
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Assume Role Policy (JSON) *</label>
          <textarea
            value={config.assume_role_policy || ""}
            onChange={(e) => updateConfig("assume_role_policy", e.target.value)}
            placeholder={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}`}
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white text-sm h-32"
          />
          <p className="text-xs text-gray-400 mt-1">
            Define which service or entity can assume this role.
          </p>
        </div>
      </div>
    )}

    {/* Common Policy */}
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Inline Policy (JSON)</label>
      <textarea
        value={config.policy_document || ""}
        onChange={(e) => updateConfig("policy_document", e.target.value)}
        placeholder={`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::my-bucket/*"
    }
  ]
}`}
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white text-sm h-32"
      />
      <p className="text-xs text-gray-400 mt-1">
        Attach an inline policy to the user or role.
      </p>
    </div>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Environment Tag</label>
      <select
        value={config.environment || "prod"}
        onChange={(e) => updateConfig("environment", e.target.value)}
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
      >
        <option value="dev">Development</option>
        <option value="staging">Staging</option>
        <option value="prod">Production</option>
      </select>
    </div>
  </>
)}



      {/* Load Balancer (lb) Configuration */}
{moduleId === "lb" && provider === "aws" && (
  <>
    <div className="mb-4">
      <label htmlFor="lbType" className="block text-sm font-medium mb-1">
        Load Balancer Type *
      </label>
      <select
        id="lbType"
        value={config.lbType || "alb"}
        onChange={(e) => updateConfig("lbType", e.target.value)}
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        required
      >
        <option value="alb">Application Load Balancer (ALB)</option>
        <option value="nlb">Network Load Balancer (NLB)</option>
        <option value="gwlb">Gateway Load Balancer (GWLB)</option>
      </select>
    </div>

    <div className="mb-4">
      <label htmlFor="targetPort" className="block text-sm font-medium mb-1">
        Target Port
      </label>
      <input
        id="targetPort"
        type="number"
        min="1"
        max="65535"
        value={config.targetPort || 80}
        onChange={(e) => updateConfig("targetPort", parseInt(e.target.value, 10) || 80)}
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>

    {/* HTTPS Settings (ALB only) */}
    {config.lbType === "alb" && (
      <>
        <div className="flex items-center mb-4">
          <input
            id="enableHttps"
            type="checkbox"
            checked={!!config.enableHttps}
            onChange={(e) => updateConfig("enableHttps", e.target.checked)}
            className="h-4 w-4 rounded text-orange-500 border-[#3a5b9b] bg-[#2A4C83] focus:ring-orange-500"
          />
          <label htmlFor="enableHttps" className="ml-2 text-sm font-medium">
            Enable HTTPS
          </label>
        </div>

        {config.enableHttps && (
          <div className="mb-4">
            <label htmlFor="certificateArn" className="block text-sm font-medium mb-1">
              ACM Certificate ARN *
            </label>
            <input
              id="certificateArn"
              type="text"
              value={config.certificateArn || ""}
              onChange={(e) => updateConfig("certificateArn", e.target.value.trim())}
              placeholder="arn:aws:acm:region:account:certificate/uuid"
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Must be a valid ACM certificate in the same region.
            </p>
          </div>
        )}
      </>
    )}

    {/* VPC Selection */}
    <div className="mb-4">
      <label htmlFor="vpcId" className="block text-sm font-medium mb-1">
        VPC *
      </label>
      <select
        id="vpcId"
        value={config.vpcId || ""}
        onChange={(e) => updateConfig("vpcId", e.target.value)}
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        required
      >
        <option value="">-- Select VPC --</option>
        {vpcs.map((vpc) => (
          <option key={vpc.id} value={vpc.id}>
            {vpc.name ? `${vpc.name} (${vpc.id})` : vpc.id} — CIDR: {vpc.cidrBlock}
          </option>
        ))}
      </select>
    </div>

    {/* Subnet Multi-Select (only when VPC selected) */}
    {config.vpcId && (
      <div className="mb-4">
        <label htmlFor="subnets" className="block text-sm font-medium mb-1">
          Subnets * (select ≥2 for HA)
        </label>
        <select
          id="subnets"
          multiple
          value={config.subnets || []}
          onChange={(e) =>
            updateConfig(
              "subnets",
              Array.from(e.target.selectedOptions, (opt) => opt.value)
            )
          }
          className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white h-28 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          required
        >
          {vpcs
            .find((vpc) => vpc.id === config.vpcId)
            ?.subnets?.map((subnet) => (
              <option key={subnet.id} value={subnet.id}>
                {subnet.name || subnet.id} — AZ: {subnet.availabilityZone}
              </option>
            )) || []}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          Hold <kbd className="px-1 bg-gray-700 rounded">Ctrl</kbd> (Win/Linux) or{" "}
          <kbd className="px-1 bg-gray-700 rounded">Cmd</kbd> (Mac) to select multiple.
        </p>
      </div>
    )}
  </>
)}

{moduleId === "efs" && provider === "aws" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">File System Name *</label>
            <input
              type="text"
              value={config.name || ""}
              onChange={(e) => updateConfig("name", e.target.value)}
              placeholder="my-efs-file-system"
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Performance Mode</label>
            <select
              value={config.performanceMode || "generalPurpose"}
              onChange={(e) => updateConfig("performanceMode", e.target.value)}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value="generalPurpose">General Purpose</option>
              <option value="maxIO">Max I/O</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Throughput Mode</label>
            <select
              value={config.throughputMode || "provisioned"}
              onChange={(e) => updateConfig("throughputMode", e.target.value)}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value="provisioned">Provisioned</option>
              <option value="bursting">Bursting</option>
            </select>
          </div>
          {(config.throughputMode === "provisioned") && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Provisioned Throughput (MiB/s)</label>
              <input
                type="number"
                value={config.provisionedThroughput || 100}
                onChange={(e) => updateConfig("provisionedThroughput", parseInt(e.target.value) || 100)}
                min="1"
                max="1024"
                className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
              />
            </div>
          )}
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={config.encrypted !== false} // Default to true
              onChange={(e) => updateConfig("encrypted", e.target.checked)}
              className="rounded text-orange-500"
            />
            <label className="ml-2 text-sm font-medium">Encrypt File System</label>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Environment Tag</label>
            <select
              value={config.environment || "prod"}
              onChange={(e) => updateConfig("environment", e.target.value)}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
            </select>
          </div>
          {/* Note: VPC, Subnet, and Security Group selection for mount targets would require */}
          {/* more complex logic linking to the VPC module or existing VPCs fetched earlier. */}
          {/* For now, this basic config is added. */}
        </>
      )}

{/* Route53 Configuration */}
{moduleId === "route53" && provider === "aws" && (
  <>
    <div className="mb-4">
      <label htmlFor="domainName" className="block text-sm font-medium mb-1">
        Domain Name (Hosted Zone) *
      </label>
      <input
        id="domainName"
        type="text"
        value={config.domainName || ""}
        onChange={(e) =>
          updateConfig("domainName", e.target.value.toLowerCase().trim())
        }
        placeholder="example.com"
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        required
      />
      <p className="text-xs text-gray-400 mt-1">
        Enter a domain with a public hosted zone in Route&nbsp;53.
      </p>
    </div>

    <div className="mb-4">
      <label htmlFor="recordName" className="block text-sm font-medium mb-1">
        Record Name
      </label>
      <input
        id="recordName"
        type="text"
        value={config.recordName || ""}
        onChange={(e) => updateConfig("recordName", e.target.value.toLowerCase().trim())}
        placeholder="www, app, or leave blank for root (@)"
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>

    <div className="mb-4">
      <label htmlFor="recordType" className="block text-sm font-medium mb-1">
        Record Type *
      </label>
      <select
        id="recordType"
        value={config.recordType || "A"}
        onChange={(e) => updateConfig("recordType", e.target.value)}
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        required
      >
        <option value="A">A — IPv4 Address</option>
        <option value="AAAA">AAAA — IPv6 Address</option>
        <option value="CNAME">CNAME — Alias (not for root)</option>
      </select>
    </div>

    <div className="mb-4">
      <label htmlFor="target" className="block text-sm font-medium mb-1">
        {config.recordType === "CNAME"
          ? "CNAME Target (e.g., app.example.com)"
          : "Alias Target (e.g., ALB DNS name)"}
        *
      </label>
      <input
        id="target"
        type="text"
        value={config.target || ""}
        onChange={(e) => updateConfig("target", e.target.value.trim())}
        placeholder={
          config.recordType === "CNAME"
            ? "app.example.com"
            : "my-alb-123.elb.us-east-1.amazonaws.com"
        }
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        required
      />
      <p className="text-xs text-gray-400 mt-1">
        For A records: use an ALB/NLB DNS name to create an alias (no TTL, free).
      </p>
    </div>

    <div className="mb-4">
      <label htmlFor="routingPolicy" className="block text-sm font-medium mb-1">
        Routing Policy
      </label>
      <select
        id="routingPolicy"
        value={config.routingPolicy || "simple"}
        onChange={(e) => updateConfig("routingPolicy", e.target.value)}
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
      >
        <option value="simple">Simple</option>
        <option value="weighted">Weighted</option>
        <option value="latency">Latency-Based</option>
      </select>
    </div>

    {config.routingPolicy === "weighted" && (
      <div className="mb-4">
        <label htmlFor="weight" className="block text-sm font-medium mb-1">
          Weight (0–255)
        </label>
        <input
          id="weight"
          type="number"
          min="0"
          max="255"
          value={config.weight != null ? config.weight : 100}
          onChange={(e) => updateConfig("weight", Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0)))}
          className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        />
      </div>
    )}

    {config.routingPolicy === "latency" && (
      <div className="mb-4">
        <label htmlFor="latencyRegion" className="block text-sm font-medium mb-1">
          Latency Region
        </label>
        <select
          id="latencyRegion"
          value={config.region || formData.region || "us-east-1"}
          onChange={(e) => updateConfig("region", e.target.value)}
          className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="us-east-1">US East (N. Virginia)</option>
          <option value="us-west-2">US West (Oregon)</option>
          <option value="eu-west-1">EU (Ireland)</option>
          <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
        </select>
      </div>
    )}

    <div className="flex items-start mb-4">
      <input
        id="enableHealthCheck"
        type="checkbox"
        checked={!!config.enableHealthCheck}
        onChange={(e) => updateConfig("enableHealthCheck", e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded text-orange-500 border-[#3a5b9b] bg-[#2A4C83] focus:ring-orange-500"
      />
      <div className="ml-2">
        <label htmlFor="enableHealthCheck" className="text-sm font-medium">
          Enable Health Check
        </label>
        <p className="text-xs text-gray-400 mt-0.5">
          Route 53 will monitor endpoint health.
        </p>
      </div>
    </div>

    {config.enableHealthCheck && (
      <div className="mb-4">
        <label htmlFor="healthCheckUrl" className="block text-sm font-medium mb-1">
          Health Check Endpoint URL *
        </label>
        <input
          id="healthCheckUrl"
          type="url"
          value={config.healthCheckUrl || ""}
          onChange={(e) => updateConfig("healthCheckUrl", e.target.value.trim())}
          placeholder="https://app.example.com/health"
          className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
          required
        />
      </div>
    )}
  </>
)}

{/* KMS Configuration */}
{moduleId === "kms" && provider === "aws" && (
  <>
    <div className="mb-4">
      <label htmlFor="kmsAlias" className="block text-sm font-medium mb-1">
        KMS Key Alias *
      </label>
      <input
        id="kmsAlias"
        type="text"
        value={config.alias || ""}
        onChange={(e) => {
          let val = e.target.value.toLowerCase();
          // Only allow [a-z0-9-], no spaces, no special chars
          val = val.replace(/[^a-z0-9-]/g, '-').replace(/^-+|-+$/g, '');
          updateConfig("alias", val);
        }}
        placeholder="my-app-key"
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        required
      />
      <p className="text-xs text-gray-400 mt-1">
        Alias will be <code>alias/{config.alias || 'my-app-key'}</code>. Must be unique.
      </p>
    </div>

    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Key Rotation</label>
      <div className="flex items-center">
        <input
          id="enableKeyRotation"
          type="checkbox"
          checked={config.enableKeyRotation !== false}
          onChange={(e) => updateConfig("enableKeyRotation", e.target.checked)}
          className="h-4 w-4 rounded text-orange-500 border-[#3a5b9b] bg-[#2A4C83] focus:ring-orange-500"
        />
        <label htmlFor="enableKeyRotation" className="ml-2 text-sm">
          Enable automatic annual rotation
        </label>
      </div>
    </div>

    <div className="mb-4">
      <label htmlFor="kmsDescription" className="block text-sm font-medium mb-1">
        Description
      </label>
      <textarea
        id="kmsDescription"
        value={config.description || "KMS key for encrypting cloud resources"}
        onChange={(e) => updateConfig("description", e.target.value)}
        className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
        rows="2"
      />
    </div>
  </>
)}

      {moduleId === "eks" && provider === "aws" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Cluster Name</label>
            <input
              type="text"
              value={config.clusterName || ""}
              onChange={(e) => updateConfig("clusterName", e.target.value)}
              placeholder="my-eks-cluster"
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Node Count</label>
            <select
              value={config.nodeCount || 2}
              onChange={(e) => updateConfig("nodeCount", parseInt(e.target.value))}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Instance Type</label>
            <select
              value={config.instanceType || "t3.medium"}
              onChange={(e) => updateConfig("instanceType", e.target.value)}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value="t3.medium">t3.medium</option>
              <option value="t3.large">t3.large</option>
              <option value="m5.large">m5.large</option>
            </select>
          </div>
        </>
      )}

      {moduleId === "ecr" && provider === "aws" && (
        <>
          <div className="flex items-start space-x-2 mb-4">
            <input
              type="checkbox"
              checked={config.autoCreateIAM !== false}
              onChange={(e) => updateConfig("autoCreateIAM", e.target.checked)}
              className="mt-1 rounded text-orange-500"
            />
            <div>
              <label className="text-sm font-medium">Auto-create IAM role</label>
              <p className="text-xs text-gray-400">Grants push/pull access.</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image Tag Mutability</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name={`mutability-${moduleId}`}
                  checked={config.imageTagMutability === 'MUTABLE'}
                  onChange={() => updateConfig("imageTagMutability", 'MUTABLE')}
                  className="mr-2"
                />
                Mutable
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name={`mutability-${moduleId}`}
                  checked={config.imageTagMutability === 'IMMUTABLE'}
                  onChange={() => updateConfig("imageTagMutability", 'IMMUTABLE')}
                  className="mr-2"
                />
                Immutable
              </label>
            </div>
          </div>
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              checked={config.scanOnPush !== false}
              onChange={(e) => updateConfig("scanOnPush", e.target.checked)}
              className="rounded text-orange-500"
            />
            <label className="ml-2 text-sm font-medium">Enable scan on push</label>
          </div>
        </>
      )}

      {moduleId === "dynamodb" && provider === "aws" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Environment Tag</label>
          <select
            value={config.environment || "prod"}
            onChange={(e) => updateConfig("environment", e.target.value)}
            className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
          >
            <option value="dev">Development</option>
            <option value="staging">Staging</option>
            <option value="prod">Production</option>
          </select>
        </div>
      )}

      {moduleId === "lambda" && provider === "aws" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Runtime</label>
                  <select
                    value={config.runtime || ""}
                    onChange={(e) => updateConfig("runtime", e.target.value)}
                    className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
                  >
                    <option value="">-- Select Runtime --</option>
                    <option value="python3.9">Python 3.9</option>
                    <option value="nodejs18.x">Node.js 18.x</option>
                    <option value="java17">Java 17</option>
                    <option value="dotnet6">.NET 6</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Handler</label>
                  <input
                    type="text"
                    value={config.handler || "lambda_function.lambda_handler"}
                    onChange={(e) => updateConfig("handler", e.target.value)}
                    placeholder="lambda_function.lambda_handler"
                    className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
                  />
                </div>
              </>
            )}

            {moduleId === "sns" && provider === "aws" && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Display Name</label>
                  <input
                    type="text"
                    value={config.displayName || ""}
                    onChange={(e) => updateConfig("displayName", e.target.value)}
                    placeholder="MyProject Alert Notifications"
                    className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email Subscription</label>
                  <input
                    type="email"
                    value={config.emailSubscription || ""}
                    onChange={(e) => updateConfig("emailSubscription", e.target.value)}
                    placeholder="Enter email address (e.g., company@example.com)"
                    className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">This email will receive notifications from the SNS topic.</p>
                </div>
              </>
            )}

            {moduleId === "cloudwatch" && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Log Group Name *</label>
            <input
              type="text"
              value={config.logGroupName || ""}
              onChange={(e) => updateConfig("logGroupName", e.target.value)}
              placeholder="my-app-logs"
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Unique name for your log group (e.g., /aws/lambda/my-function).
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Retention Period (Days)</label>
            <select
              value={config.retentionInDays || 14}
              onChange={(e) => updateConfig("retentionInDays", parseInt(e.target.value))}
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            >
              <option value={1}>1 Day</option>
              <option value={3}>3 Days</option>
              <option value={7}>1 Week</option>
              <option value={14}>2 Weeks (Default)</option>
              <option value={30}>1 Month</option>
              <option value={60}>2 Months</option>
              <option value={90}>3 Months</option>
              <option value={180}>6 Months</option>
              <option value={365}>1 Year</option>
              <option value={0}>Never Delete</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">KMS Key ID (Optional)</label>
            <input
              type="text"
              value={config.kmsKeyId || ""}
              onChange={(e) => updateConfig("kmsKeyId", e.target.value)}
              placeholder="arn:aws:kms:region:account:key/..."
              className="w-full bg-[#2A4C83] border border-[#3a5b9b] rounded-md p-2 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Optional KMS key ARN to encrypt logs.
            </p>
          </div>
        </>
      )}

      {/* Add GCP/Azure forms if needed later */}
    </div>
  );
};

export default ModuleConfigForm;
