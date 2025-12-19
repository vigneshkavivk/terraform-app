    // src/components/workflow/CloudWorkflow.jsx
    "use client";
    import React, { useState, useEffect } from "react";
    import { useNavigate, useLocation } from 'react-router-dom';
    import ProviderSelector from './ProviderSelector';
    import ConnectionForm from './ConnectionForm';
    import ModuleSelector from './ModuleSelector';
    import ConfigureSummary from './ConfigureSummary';
    import CreateStep from './CreateStep';
    import AccountResources from './AccountResources'; // 👈 Add this
    import { ChevronLeft, ChevronRight, Eye, Settings, Rocket } from "lucide-react";
    import { providers, modules } from './constants';
    import { useAuth } from '../../hooks/useAuth';

    const CloudWorkflow = () => {
    const { hasPermission, user } = useAuth();

    // 🚫 Block entire page if no read access
    if (!hasPermission('Agent', 'Read')) {
        return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f121a]">
            <div className="bg-gray-900/80 p-6 rounded-lg border border-red-900/30">
            <h2 className="text-xl font-bold text-red-400">🔒 Access Denied</h2>
            <p className="text-gray-300 mt-2">
                You need <code>Workflow Read</code> permission to access cloud provisioning.
            </p>
            </div>
        </div>
        );
    }

    // ✅ Define permission flags for UI control
    const canConnect = hasPermission('Credentials', 'Create'); // To add new account
    const canUseExisting = hasPermission('Credentials', 'Read'); // To view/use existing accounts
    const canSelectModules = hasPermission('Agent', 'Configure'); // To select/configure modules
    const canReview = hasPermission('Agent', 'Read'); // Already true if we're here, but explicit
    const canDeploy = hasPermission('Agent', 'Create'); // For Step 5 (deploy button)

    const navigate = useNavigate();
    const location = useLocation();
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [formData, setFormData] = useState({
        accessKey: "", secretKey: "", region: "us-east-1",
        serviceAccountJson: "", tenantId: "", clientId: "", clientSecret: "", subscriptionId: "",
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedModules, setSelectedModules] = useState([]);
    const [isCreated, setIsCreated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [responseMessage, setResponseMessage] = useState("");
    const [connectedAccounts, setConnectedAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [moduleValid, setModuleValid] = useState(false);
    const [vpcs, setVpcs] = useState([]);
    const [usingExistingAccount, setUsingExistingAccount] = useState(false);
    const [formValid, setFormValid] = useState(false);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [dynamicPricing, setDynamicPricing] = useState({});
    const [showIacPreview, setShowIacPreview] = useState(false);
    const [moduleConfig, setModuleConfig] = useState({});
    const [iacCode, setIacCode] = useState("");
    const [deploymentLogs, setDeploymentLogs] = useState([]);
    const [showConfirmation, setShowConfirmation] = useState(false); // For the popup visibility
    const [agreedToTerms, setAgreedToTerms] = useState(false); // For the checkbox state

    // State persistence
    useEffect(() => {
        const workflowState = {
        selectedProvider,
        currentStep,
        selectedModules,
        formData,
        moduleConfig,
        isCreated,
        usingExistingAccount,
        selectedAccount,
        connectedAccounts,
        vpcs,
        formValid,
        moduleValid,
        estimatedCost,
        dynamicPricing,
        showIacPreview,
        iacCode,
        deploymentLogs
        };
        localStorage.setItem('workflowState', JSON.stringify(workflowState));
    }, [
        selectedProvider, currentStep, selectedModules, formData, moduleConfig,
        isCreated, usingExistingAccount, selectedAccount, connectedAccounts, vpcs,
        formValid, moduleValid, estimatedCost, dynamicPricing, showIacPreview, iacCode, deploymentLogs
    ]);

    // Restore state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('workflowState');
        if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            // Restore all states
            setSelectedProvider(parsedState.selectedProvider || null);
            setCurrentStep(parsedState.currentStep || 1);
            setSelectedModules(parsedState.selectedModules || []);
            setFormData(parsedState.formData || {
            accessKey: "", secretKey: "", region: "us-east-1",
            serviceAccountJson: "", tenantId: "", clientId: "", clientSecret: "", subscriptionId: "",
            });
            setModuleConfig(parsedState.moduleConfig || {});
            setIsCreated(parsedState.isCreated || false);
            setUsingExistingAccount(parsedState.usingExistingAccount || false);
            setSelectedAccount(parsedState.selectedAccount || null);
            setConnectedAccounts(parsedState.connectedAccounts || []);
            setVpcs(parsedState.vpcs || []);
            setFormValid(parsedState.formValid || false);
            setModuleValid(parsedState.moduleValid || false);
            setEstimatedCost(parsedState.estimatedCost || 0);
            setDynamicPricing(parsedState.dynamicPricing || {});
            setShowIacPreview(parsedState.showIacPreview || false);
            setIacCode(parsedState.iacCode || "");
            setDeploymentLogs(parsedState.deploymentLogs || []);
        } catch (e) {
            console.warn('Failed to parse saved workflow state:', e);
        }
        }
    }, []);

    // Fetch live pricing from backend based on selected modules
    const fetchDynamicPricing = async () => {
        if (!selectedProvider || selectedModules.length === 0 || !formData.region || !selectedAccount?._id) return;
        const modulesToFetch = [];
        if (selectedModules.includes('ec2')) modulesToFetch.push('ec2');
        if (selectedModules.includes('s3')) modulesToFetch.push('s3');
        if (selectedModules.includes('vpc')) modulesToFetch.push('vpc');
        if (modulesToFetch.length === 0) return;
        try {
        const token = JSON.parse(localStorage.getItem('user'))?.token || '';
        const res = await fetch('/api/aws/pricing', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
            region: formData.region,
            modules: modulesToFetch,
            accountId: selectedAccount._id // ✅ CRITICAL: so backend can fetch creds
            })
        });
        const data = await res.json();
        if (data.success) {
            setDynamicPricing(data.pricing || {});
        }
        } catch (err) {
        console.error('Failed to fetch dynamic pricing:', err);
        }
    };

    // Fetch accounts after provider is set
    useEffect(() => {
        if (selectedProvider === "aws") {
        const fetchAccounts = async () => {
            try {
            const token = JSON.parse(localStorage.getItem('user'))?.token || '';
            const res = await fetch('/api/aws/get-aws-accounts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const accounts = await res.json();
            setConnectedAccounts(accounts);
            // If we have accounts and no selected account, pick the first one
            } catch (error) {
            console.error('Failed to fetch connected AWS accounts:', error);
            setConnectedAccounts([]);
            }
        };
        fetchAccounts();
        }
    }, [selectedProvider]);

    // Initialize from URL path on mount
    useEffect(() => {
        const pathParts = location.pathname.split('/').filter(Boolean);
        if (pathParts.includes('work-flow') && pathParts.length > 1) {
        const provider = pathParts[pathParts.indexOf('work-flow') + 1];
        if (provider && providers.some(p => p.id === provider)) {
            setSelectedProvider(provider);
            // Determine step from URL
            const stepIndex = pathParts.indexOf(provider) + 1;
            if (stepIndex < pathParts.length) {
            const stepName = pathParts[stepIndex];
            const stepMap = {
                'connection': 1,
                'module': 2,
                'configure': 3,
                'create': 4
            };
            setCurrentStep(stepMap[stepName] || 1);
            }
        }
        }
    }, []);

    // Update URL when state changes
    useEffect(() => {
        const stepPaths = ['connection', 'existing-resources', 'module', 'configure', 'create'];
        let urlPath = '/sidebar/work-flow';
        if (selectedProvider) {
        urlPath += `/${selectedProvider}`;
        if (currentStep > 1) {
            urlPath += `/${stepPaths[currentStep - 1]}`;
        }
        }
        navigate(urlPath, { replace: true });
    }, [currentStep, selectedProvider, navigate]);

    // Helper functions
    const fetchVpcs = async () => {
        if (!selectedAccount || selectedProvider !== "aws") return;
        try {
        const token = JSON.parse(localStorage.getItem('user'))?.token || '';
        const res = await fetch('/api/aws/get-vpcs', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
            accountId: selectedAccount._id
            })
        });
        const data = await res.json();
        if (data.success) {
            setVpcs(data.vpcs);
        } else {
            console.error('Error fetching VPCs:', data.error);
        }
        } catch (error) {
        console.error('Error fetching VPCs:', error);
        }
    };

    const calculateEstimatedCost = () => {
        if (!selectedProvider || selectedModules.length === 0) {
        setEstimatedCost(0);
        return;
        }
        let totalCost = 0;
        selectedModules.forEach((moduleId) => {
        const config = moduleConfig[moduleId] || {};
        const livePrice = dynamicPricing[moduleId];
        const staticPrice = modules[selectedProvider]?.find(m => m.id === moduleId)?.price || {};
        const getPrice = (key, fallback = 0) => {
            return livePrice ? (livePrice[key] !== undefined ? livePrice[key] : fallback) : (staticPrice[key] || fallback);
        };
        if (moduleId === "ec2") {
            const instanceType = config.instanceType || "t2.micro";
            const hourly = getPrice(instanceType, 0.0116); // fallback
            totalCost += hourly * 730;
        } else if (moduleId === "s3") {
            const storageClass = config.storageClass || "STANDARD";
            const hourly = getPrice(storageClass, 0.023);
            totalCost += hourly * 730;
        } else if (moduleId === "vpc") {
            const nat = getPrice("natGateway", 0.045);
            totalCost += nat * 730;
        } else if (moduleId === "lambda") {
            const requests = config.requestsPerMonth || 1e6;
            const durationMs = config.avgDurationMs || 1000;
            const memoryMB = config.memoryMB || 128;
            const requestPrice = getPrice("requests", 0.0000002);
            const durationPrice = getPrice("duration", 0.0000166667);
            totalCost += (requests * requestPrice) + ((requests * durationMs / 1000) * (memoryMB / 1024) * durationPrice);
        } else if (moduleId === "dynamodb") {
            const read = config.readCapacityUnits || 5;
            const write = config.writeCapacityUnits || 5;
            const storage = config.storageGB || 1;
            const readPrice = getPrice("read", 0.25);
            const writePrice = getPrice("write", 1.25);
            const storagePrice = getPrice("storage", 0.25);
            totalCost += (read * 730 * 60 * readPrice) + (write * 730 * 60 * writePrice) + (storage * storagePrice);
        } else if (moduleId === "kms") {
            totalCost += getPrice("key", 1.0);
        } else if (moduleId === "route53") {
            totalCost += getPrice("hostedZone", 0.5);
        } else if (moduleId === "efs") {
            const storage = config.storageGB || 10;
            totalCost += storage * getPrice("storage", 0.30);
        } else if (moduleId === "sns") {
            const publish = config.publishCount || 1e6;
            const sms = config.smsCount || 100;
            totalCost += (publish * getPrice("publish", 0.5 / 1e6)) + (sms * getPrice("sms", 0.00645));
        } else if (moduleId === "cloudwatch") {
            const logGB = config.logGB || 1;
            const metrics = config.metricsCount || 1;
            totalCost += (logGB * getPrice("logs", 0.57)) + (metrics * getPrice("metrics", 0.30));
        } else if (moduleId === "ecr") {
            const storage = config.storageGB || 10;
            totalCost += storage * getPrice("storage", 0.10);
        } else if (moduleId === "lb") {
            const lbType = config.lbType || "alb";
            const hourly = getPrice(lbType, 0.0225);
            totalCost += hourly * 730;
        }
        // IAM, EKS, etc. – use static fallback if needed
        else if (staticPrice && typeof staticPrice === 'object') {
            const sum = Object.values(staticPrice).reduce((a, b) => a + b, 0);
            totalCost += sum * 730;
        } else if (typeof staticPrice === 'number') {
            totalCost += staticPrice * 730;
        }
        });
        setEstimatedCost(totalCost);
    };

    const generateIaCPreview = () => {
        if (!selectedProvider || selectedModules.length === 0) {
        setIacCode("");
        return;
        }
        let code = "";
        switch (selectedProvider) {
        case "aws":
            code += `# Terraform AWS Provider Configuration
    provider "aws" {
    region     = "${formData.region}"
    access_key = "*** sensitive ***"
    secret_key = "*** sensitive ***"
    }
    `;
            break;
        case "gcp":
            code += `# Terraform GCP Provider Configuration
    provider "google" {
    project     = "your-project-id"
    region      = "${formData.region}"
    credentials = file("service-account.json")
    }
    `;
            break;
        case "azure":
            code += `# Terraform Azure Provider Configuration
    provider "azurerm" {
    features {}
    subscription_id = "${formData.subscriptionId || "your-subscription-id"}"
    tenant_id       = "${formData.tenantId || "your-tenant-id"}"
    client_id       = "${formData.clientId || "your-client-id"}"
    client_secret   = "*** sensitive ***"
    }
    `;
            break;
        }
        selectedModules.forEach((moduleId) => {
        const module = modules[selectedProvider].find((m) => m.id === moduleId);
        if (module) {
            code += `# ${module.name} Resources
    `;
            const config = moduleConfig[moduleId] || {};
            module.iacResources.forEach((resource) => {
            code += `resource "${resource}" "${config.name || moduleId}" {
    `;
            if (moduleId === "ec2") {
                code += `  instance_type = "${config.instanceType || "t2.micro"}"
    `;
                if (config.amiId) code += `  ami = "${config.amiId}"
    `;
                if (config.vpcId === "default") {
                code += `  # Uses default VPC
    `;
                } else if (config.vpcId === "use-selected-vpc" && selectedModules.includes("vpc")) {
                code += `  subnet_id = aws_subnet.${moduleConfig.vpc?.name || "main"}.id
    `;
                }
            } else if (moduleId === "s3") {
                code += `  bucket = "${config.name || "my-bucket"}"
    `;
                code += `  force_destroy = true
    `;
            } else if (moduleId === "dynamodb") {
                code += `  name = "${config.name || "my-dynamodb-table"}"
    `;
                code += `  tags = { Environment = "${config.environment || "prod"}" }
    `;
            } else if (moduleId === "vpc") {
                const cidr = config.cidrBlock || "10.0.0.0/16";
                const subnetCount = config.subnetCount || 2;
                const publicSubnets = [];
                const privateSubnets = [];
                for (let i = 0; i < Math.ceil(subnetCount / 2); i++) {
                publicSubnets.push(`"10.0.${i + 1}.0/24"`);
                privateSubnets.push(`"10.0.${i + 1 + Math.ceil(subnetCount / 2)}.0/24"`);
                }
                code += `  vpc_cidr             = "${cidr}"
    `;
                code += `  public_subnets       = [${publicSubnets.join(", ")}]
    `;
                code += `  private_subnets      = [${privateSubnets.join(", ")}]
    `;
            } else if (moduleId === "eks") {
                code += `  name = "${config.clusterName || "my-eks-cluster"}"
    `;
            } else if (moduleId === "ecr") {
                code += `  name = "${config.name}"
    `;
                code += `  image_tag_mutability = "${config.imageTagMutability || 'MUTABLE'}"
    `;
                code += `  image_scanning_configuration {
    `;
                code += `    scan_on_push = ${config.scanOnPush !== false}
    `;
                code += `  }
    `;
            } else if (moduleId === "lambda") {
                code += `  function_name = "${config.functionName || "my-lambda-function"}"
    `;
                code += `  runtime = "${config.runtime || "python3.9"}"
    `;
                code += `  handler = "${config.handler || "lambda_function.lambda_handler"}"
    `;
                code += `  # You will need to specify the source code for your Lambda function.
    `;
                code += `  # Example: filename = "lambda_function.py"
    `;
                code += `  # Or use a zip file: filename = "function.zip"
    `;
            } else if (moduleId === "cloudwatch") {
                code += `  name = "${config.logGroupName || 'default-log-group'}"
    `;
                code += `  retention_in_days = ${config.retentionInDays || 14}
    `;
                if (config.kmsKeyId) {
                code += `  kms_key_id = "${config.kmsKeyId}"
    `;
                }
            } else if (moduleId === "sns") {
                const topicName = config.name || "my-sns-topic";
                code += `resource "aws_sns_topic" "${topicName}" {
    `;
                code += `  name = "${topicName}"
    `;
                if (config.displayName) {
                code += `  display_name = "${config.displayName}"
    `;
                }
                code += `}
    `;
                if (config.emailSubscription) {
                code += `
    resource "aws_sns_topic_subscription" "${topicName}_email_sub" {
    `;
                code += `  topic_arn = aws_sns_topic.${topicName}.arn
    `;
                code += `  protocol  = "email"
    `;
                code += `  endpoint  = "${config.emailSubscription}"
    `;
                code += `}
    `;
                }
            } else if (moduleId === "kms") {
                code += `  alias       = "alias/${config.alias || "my-key"}"
    `;
                code += `  description = "${config.description || "KMS key for encryption"}"
    `;
                code += `  enable_key_rotation = ${config.enableKeyRotation !== false}
    `;
            } else if (moduleId === "route53") {
                code += `  domain_name     = "${config.domainName || ""}"
    `;
                code += `  record_name     = "${config.recordName || config.domainName || ""}"
    `;
                code += `  record_type     = "${config.recordType || "A"}"
    `;
                code += `  target          = "${config.target || ""}"
    `;
                code += `  routing_policy  = "${config.routingPolicy || "simple"}"
    `;
                if (config.routingPolicy === "weighted" && config.weight != null) {
                code += `  weight = ${Math.min(255, Math.max(0, parseInt(config.weight) || 0))}
    `;
                }
                if (config.routingPolicy === "latency" && config.region) {
                code += `  region = "${config.region}"
    `;
                }
                code += `  enable_health_check = ${!!config.enableHealthCheck}
    `;
                if (config.enableHealthCheck && config.healthCheckUrl) {
                code += `  health_check_url = "${config.healthCheckUrl}"
    `;
                }
            } else if (moduleId === "lb") {
                code += `  name      = "${config.name || "my-load-balancer"}"
    `;
                code += `  lb_type   = "${config.lbType || "nlb"}"
    `;
                code += `  vpc_id    = "${config.vpcId || ""}"
    `;
                const subnetList = (config.subnets || []).map(s => `"${s}"`).join(", ");
                code += `  subnets   = [${subnetList}]
    `;
                if (config.targetPort) {
                code += `  target_port = ${config.targetPort}
    `;
                }
                if (config.lbType === "alb") {
                code += `  enable_https = ${!!config.enableHttps}
    `;
                if (config.enableHttps && config.certificateArn) {
                    code += `  certificate_arn = "${config.certificateArn}"
    `;
                }
                }
            }
            code += `}
    `;
            });
        }
        });
        setIacCode(code);
    };

    const toggleModule = (moduleId) => {
        if (moduleId === "eks") {
        navigate('/sidebar/clusters');
        return;
        }
        setSelectedModules([moduleId]);
        const newConfig = {};
        if (!moduleConfig[moduleId]) {
        newConfig[moduleId] = {
            name: "",
            region: formData.region,
            ...(moduleId === "ec2" && { instanceType: "t2.micro", amiId: "", vpcId: "" }),
            ...(moduleId === "s3" && { storageClass: "STANDARD" }),
            ...(moduleId === "vpc" && { cidrBlock: "10.0.0.0/16", subnetCount: 2 }),
            ...(moduleId === "ecr" && { imageTagMutability: "MUTABLE", scanOnPush: true }),
            ...(moduleId === "kms" && {
            alias: "",
            description: "KMS key for encryption",
            enableKeyRotation: true
            }),
            ...(moduleId === "route53" && {
            domainName: "",
            recordName: "",
            recordType: "A",
            target: "",
            routingPolicy: "simple",
            enableHealthCheck: false,
            healthCheckUrl: ""
            }),
            ...(moduleId === "efs" && {
            performanceMode: "generalPurpose",
            throughputMode: "provisioned",
            encrypted: true,
            provisionedThroughput: 100, // Default value for provisioned mode
            environment: "prod" // Default environment tag
            }),
            ...(moduleId === "lb" && {
            name: "",
            lbType: "alb", // or "alb"
            vpcId: "",
            subnets: [],
            targetPort: 80,
            enableHttps: false,
            certificateArn: ""
            }),
        };
        } else {
        newConfig[moduleId] = moduleConfig[moduleId];
        }
        setModuleConfig(newConfig);
    };

    const selectProvider = (providerId) => {
        const provider = providers.find((p) => p.id === providerId);
        // Reset all workflow state
        setSelectedProvider(provider.id);
        setFormData({ ...formData, region: provider.regions[0] });
        setCurrentStep(1); // Force back to Step 1
        // Re-fetch accounts for AWS
        if (providerId === "aws") {
        fetch('/api/aws/get-aws-accounts', {
            headers: { 'Authorization': `Bearer ${JSON.parse(localStorage.getItem('user'))?.token || ''}` }
        })
            .then(res => res.json())
            .then(accounts => {
            setConnectedAccounts(accounts);
            setSelectedAccount(null);
            setUsingExistingAccount(false);
            })
            .catch(err => {
            console.error('Failed to fetch connected AWS accounts:', err);
            setConnectedAccounts([]);
            });
        }
    };

    const handleValidate = async () => {
        if (selectedProvider !== "aws") return;
        const token = JSON.parse(localStorage.getItem('user'))?.token || '';
        const res = await fetch('/api/aws/validate-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            accessKeyId: formData.accessKey,
            secretAccessKey: formData.secretKey,
            region: formData.region
        })
        });
        const data = await res.json();
        setResponseMessage(data.valid ? '✅ Connection successful!' : `❌ ${data.error}`);
        setTimeout(() => setResponseMessage(""), 3000);
    };

    const handleConnect = async () => {
        if (selectedProvider !== "aws") return;
        const token = JSON.parse(localStorage.getItem('user'))?.token || '';
        // Use relative path (no API_BASE)
        const res = await fetch('/api/aws/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            accessKeyId: formData.accessKey,
            secretAccessKey: formData.secretKey,
            region: formData.region
        })
        });
        const data = await res.json();
        // ALSO fix this line — use relative path!
        const accountsRes = await fetch('/api/aws/get-aws-accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
        });
        const freshAccounts = await accountsRes.json();
        setConnectedAccounts(freshAccounts);
        if (data.success) {
        setResponseMessage('✅ Account saved successfully!');
        setSelectedAccount(null);
        setUsingExistingAccount(false);
        } else {
        setResponseMessage(`❌ ${data.error || 'Failed to connect'}`);
        }
        setTimeout(() => setResponseMessage(""), 3000);
    };

    const handleReset = () => {
        setSelectedProvider(null);
        setCurrentStep(1);
        setIsCreated(false);
        setSelectedModules([]); // Clear selected modules
        setModuleConfig({}); // Clear module config
        setIsCreated(false); // Reset deployment status
        setDeploymentLogs([]); // Clear logs
        setUsingExistingAccount(false); // Reset account selection
        setSelectedAccount(null); // Clear selected account
        setConnectedAccounts([]); // Clear connected accounts
        setVpcs([]); // Clear VPCs
        setFormData({
        accessKey: "", secretKey: "", region: "us-east-1",
        serviceAccountJson: "", tenantId: "", clientId: "", clientSecret: "", subscriptionId: "",
        });
        setDeploymentLogs([]);
        localStorage.removeItem('workflowState'); // Clear saved state
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setLoading(true);
        setDeploymentLogs([]);
        setIsCreated(false);
        const token = JSON.parse(localStorage.getItem('user'))?.token || '';
        const payload = {
        provider: selectedProvider,
        region: formData.region,
        modules: selectedModules,
        moduleConfig: moduleConfig,
        account: selectedAccount,
        credentials: {
            accessKey: formData.accessKey,
            secretKey: formData.secretKey,
            serviceAccountJson: formData.serviceAccountJson,
            tenantId: formData.tenantId,
            clientId: formData.clientId,
            clientSecret: formData.clientSecret,
            subscriptionId: formData.subscriptionId
        }
        };
        try {
        const deployRes = await fetch('/api/terraform/deploy', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
        });
        const result = await deployRes.json();
        if (!result.success) {
            setDeploymentLogs([`❌ Deploy failed: ${result.error}`]);
            setLoading(false);
            return;
        }
        const deploymentId = result.deploymentId;
        const pollLogs = async () => {
            try {
            const logRes = await fetch(`/api/terraform/logs/${deploymentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const logs = await logRes.text();
            const logLines = logs
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${line}`);
            setDeploymentLogs(logLines);
            if (logs.includes('Apply complete') || logs.includes('Error')) {
                setIsCreated(true);
                setLoading(false);
            } else {
                setTimeout(pollLogs, 1000);
            }
            } catch (err) {
            console.error('Log poll error:', err);
            setTimeout(pollLogs, 2000);
            }
        };
        pollLogs();
        } catch (error) {
        setDeploymentLogs([`❌ Network error: ${error.message}`]);
        setLoading(false);
        }
    };

    // Effects for data fetching and validation
    useEffect(() => {
        if (selectedAccount && selectedProvider === "aws") {
        fetchVpcs();
        } else {
        setVpcs([]);
        }
    }, [selectedAccount, selectedProvider]);

    useEffect(() => {
        if (selectedProvider && currentStep === 3) {
        fetchDynamicPricing(); // ✅ Fetch live pricing FIRST
        }
    }, [selectedProvider, selectedModules, currentStep, formData.region]);

    // Then recalculate cost when dynamicPricing updates
    useEffect(() => {
        if (currentStep === 3) {
        calculateEstimatedCost();
        generateIaCPreview();
        }
    }, [dynamicPricing, moduleConfig, selectedModules, currentStep]);

    useEffect(() => {
        if (selectedProvider === "aws") {
        if (usingExistingAccount && selectedAccount) {
            setFormValid(true);
        } else if (!usingExistingAccount && formData.accessKey && formData.secretKey && formData.region) {
            setFormValid(true);
        } else {
            setFormValid(false);
        }
        } else {
        setFormValid(!!formData.region);
        }
    }, [selectedProvider, usingExistingAccount, selectedAccount, formData]);

    // Fetch live pricing when account/region/modules change
    useEffect(() => {
        if (currentStep >= 3 && selectedAccount?._id && formData.region && selectedModules.length > 0) {
        const fetchPricing = async () => {
            try {
            const token = JSON.parse(localStorage.getItem('user'))?.token || '';
            const res = await fetch('/api/aws/pricing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                region: formData.region,
                modules: selectedModules,
                accountId: selectedAccount._id
                })
            });
            const data = await res.json();
            if (data.success) {
                setDynamicPricing(data.pricing || {});
            } else {
                console.warn('Pricing fallback to static');
                setDynamicPricing({});
            }
            } catch (err) {
            console.error('Pricing fetch failed:', err);
            setDynamicPricing({});
            }
        };
        fetchPricing();
        }
    }, [selectedAccount?._id, formData.region, selectedModules.join(','), currentStep]);

    useEffect(() => {
        if (selectedProvider && selectedModules.length > 0) {
        const moduleId = selectedModules[0];
        // ✅ Safely get modules for provider
        const providerModules = modules[selectedProvider] || [];
        const module = providerModules.find(m => m.id === moduleId);
        // ✅ Safely get config
        const config = moduleConfig[moduleId] || {};
        let isValid = false;
        if (moduleId === "ec2") {
            if (config.vpcId === "default" || config.vpcId === "use-selected-vpc") {
            isValid = config.name && config.instanceType && config.vpcId;
            } else {
            isValid = config.name && config.instanceType && config.vpcId && config.subnetId && config.securityGroupId && config.keyName;
            }
        } else if (moduleId === "s3") {
            isValid = config.name && config.storageClass;
        } else if (moduleId === "vpc") {
            isValid = config.name && config.cidrBlock;
        } else if (moduleId === "eks") {
            isValid = config.clusterName && config.nodeCount && config.instanceType;
        } else if (moduleId === "cloudwatch") {
            isValid = config.logGroupName;
        } else if (moduleId === "sns") {
            isValid = config.name && config.emailSubscription;
        } else if (moduleId === "iam") {
            const hasUser = config.create_user === true && config.user_name?.trim();
            const hasRole = config.create_role === true && config.role_name?.trim() && config.assume_role_policy?.trim();
            isValid = hasUser || hasRole;
        } else if (moduleId === "ecr") {
            isValid = config.name;
        } else if (moduleId === "lambda") {
            isValid = config.name && config.runtime;
        } else if (moduleId === "lb") {
            isValid = config.name && config.lbType && config.vpcId && config.subnets?.length > 0;
            if (config.lbType === "alb" && config.enableHttps) {
            isValid = isValid && config.certificateArn;
            }
        } else if (moduleId === "kms") {
            const aliasValid = config.alias && /^[a-z0-9][a-z0-9-]*$/.test(config.alias);
            isValid = aliasValid;
        } else if (moduleId === "route53") {
            const domainValid = config.domainName && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(config.domainName);
            const targetValid = config.target?.trim() !== "";
            const recordTypeValid = ["A", "AAAA", "CNAME"].includes(config.recordType);
            isValid = domainValid && targetValid && recordTypeValid;
            if (config.routingPolicy === "weighted") {
            isValid = isValid && config.weight >= 0 && config.weight <= 255;
            }
            if (config.enableHealthCheck) {
            isValid = isValid && config.healthCheckUrl?.trim() !== "";
            }
        } else if (moduleId === "efs") {
            // Example validation: name is required, throughput mode is required, and provisioned throughput is needed if mode is provisioned
            if (config.throughputMode === 'provisioned') {
            isValid = config.name && config.throughputMode && config.provisionedThroughput > 0;
            } else {
            // For 'bursting' mode, maybe only name and mode are required
            isValid = config.name && config.throughputMode;
            }
        } else if (moduleId === "dynamodb") {
            isValid = config.name;
        } else {
            isValid = true;
        }
        setModuleValid(isValid);
        } else {
        setModuleValid(false);
        }
    }, [selectedProvider, selectedModules, moduleConfig]);

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
        case 1:
            return selectedProvider ? (
            <ConnectionForm
                selectedProvider={selectedProvider}
                formData={formData}
                setFormData={setFormData}
                connectedAccounts={connectedAccounts}
                selectedAccount={selectedAccount}
                setSelectedAccount={setSelectedAccount}
                usingExistingAccount={usingExistingAccount}
                setUsingExistingAccount={setUsingExistingAccount}
                onValidate={handleValidate}
                onConnect={handleConnect}
                responseMessage={responseMessage}
                formValid={formValid}
            />
            ) : (
            <ProviderSelector onSelectProvider={selectProvider} />
            );
        case 2:
            return (
            <div className="mt-4">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                <Eye className="mr-2 text-emerald-400" /> Existing AWS Resources
                </h2>
                <p className="text-gray-400 mb-6">
                Scanning account <code className="bg-gray-800 px-2 py-0.5 rounded">{selectedAccount?.accountId}</code>...
                This helps avoid naming conflicts and shows current state.
                </p>
                <AccountResources
                selectedAccount={selectedAccount}
                selectedProvider={selectedProvider}
                onCreateNewResource={() => setCurrentStep(3)}
                />
            </div>
            );
        case 3:
            return (
            <ModuleSelector
                selectedProvider={selectedProvider}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedModules={selectedModules}
                toggleModule={toggleModule}
                moduleConfig={moduleConfig}
                setModuleConfig={setModuleConfig}
                vpcs={vpcs}
                awsAccountId={selectedAccount?._id} // ✅ CRITICAL: Pass MongoDB _id of selected account
            />
            );
        case 4:
            return (
            <ConfigureSummary
                selectedProvider={selectedProvider}
                formData={formData}
                selectedAccount={selectedAccount}
                selectedModules={selectedModules}
                modules={modules}
                estimatedCost={estimatedCost}
                showIacPreview={showIacPreview}
                setShowIacPreview={setShowIacPreview}
                iacCode={iacCode}
            />
            );
        case 5:
            return (
            <div>
                {/* Main Create Step Content */}
                <CreateStep
                isCreated={isCreated}
                selectedProvider={selectedProvider}
                formData={formData}
                selectedModules={selectedModules}
                estimatedCost={estimatedCost}
                deploymentLogs={deploymentLogs}
                loading={loading}
                onDeploy={() => setShowConfirmation(true)} // 👈 Trigger the popup instead of deploying directly
                onReset={handleReset}
                onBack={() => setCurrentStep(3)}
                />
                {/* Confirmation Popup Modal */}
                {showConfirmation && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1f2b] rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-700">
                    <h2 className="text-xl font-bold mb-4 text-white">Confirm Deployment</h2>
                    <p className="mb-6 text-gray-300">
                        By proceeding, you acknowledge and agree to the following:
                    </p>
                    <ul className="list-disc list-inside mb-6 text-sm text-gray-400 space-y-2">
                        <li>You are responsible for the costs associated with the deployed resources.</li>
                        <li>These resources will be created in your cloud account ({selectedAccount?.accountId}).</li>
                        <li>You agree to our <a href="#" className="text-emerald-400 hover:underline">Terms of Service</a> and <a href="#" className="text-emerald-400 hover:underline">Privacy Policy</a>.</li>
                        <li>Deployment may take 2-5 minutes.</li>
                    </ul>
                    {/* Agreement Checkbox */}
                    <div className="flex items-start mb-6">
                        <input
                        type="checkbox"
                        id="agreeTerms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 mr-2 h-5 w-5 accent-emerald-500"
                        />
                        <label htmlFor="agreeTerms" className="text-gray-300">
                        I have read and agree to the Terms & Conditions.
                        </label>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                        onClick={() => setShowConfirmation(false)}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                        Cancel
                        </button>
                        <button
                        onClick={() => {
                            if (agreedToTerms) {
                            setShowConfirmation(false);
                            handleSubmit(); // 👈 Now call the actual deploy function
                            }
                        }}
                        disabled={!agreedToTerms}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            agreedToTerms
                            ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white'
                            : 'bg-gray-700 cursor-not-allowed text-gray-400'
                        }`}
                        >
                        Agree & Deploy
                        </button>
                    </div>
                    </div>
                </div>
                )}
            </div>
            );
        default:
            return null;
        }
    };

    // Steps definition
    const steps = [
        { id: 1, name: "Connection" },
        { id: 2, name: "Existing Resources" },
        { id: 3, name: "Modules" },
        { id: 4, name: "Configure" },
        { id: 5, name: "Create" },
    ];

    return (
        <div className="min-h-screen px-4 sm:px-6 py-8 bg-[#0f121a] text-gray-200">
        <div className="max-w-5xl mx-auto">
            {selectedProvider && (
            <>
                {/* Gradient Heading — green gradient as per your preference */}
                <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-300">
                {selectedProvider.toUpperCase()} Cloud Workflow
                </h1>
                <p className="mb-8 text-gray-400 leading-relaxed max-w-3xl">
                {currentStep === 1 && "Connect to your cloud account by providing credentials."}
                {currentStep === 2 && "View existing resources already deployed in this account."}
                {currentStep === 3 && "Select which modules to deploy in your environment."}
                {currentStep === 4 && "Review configuration, pricing, and infrastructure-as-code preview."}
                {currentStep === 5 && !isCreated && "Ready to deploy your resources. This may take 2–5 minutes."}
                {currentStep === 5 && isCreated && "✅ Your infrastructure has been successfully deployed!"}
                </p>
                {/* Progress Stepper — refined with clickable steps */}
                <div className="flex items-center justify-between mb-10">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                    <div
                        className={`flex flex-col items-center cursor-pointer transition-all duration-200 hover:scale-105 ${
                        currentStep === step.id ? 'text-white' : 'text-gray-400'
                        }`}
                        onClick={() => {
                        if (step.id <= currentStep) {
                            setCurrentStep(step.id);
                        }
                        }}
                    >
                        <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow-lg ${
                            currentStep >= step.id
                            ? "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-orange-500/30"
                            : "bg-gray-800 text-gray-500"
                        }`}
                        >
                        {step.id}
                        </div>
                        <span className="text-xs mt-1.5 font-medium">
                        {step.name}
                        </span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className="flex-1 h-1 mx-3 bg-gray-800/70 relative overflow-hidden rounded-full">
                        <div
                            className={`absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500/40 to-orange-500/40 ${
                            currentStep > step.id ? 'w-full' : 'w-0'
                            } transition-all duration-500`}
                        ></div>
                        </div>
                    )}
                    </React.Fragment>
                ))}
                </div>
            </>
            )}
            {/* Main Card — black gradient like SCM box */}
            <div className="bg-gradient-to-b from-[#1a1f2b] to-[#151924] p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
            {renderStepContent()}
            {selectedProvider && currentStep !== 5 && (
                <div className="flex justify-between mt-10 pt-6 border-t border-gray-800/50">
                <button
                    onClick={() => {
                    if (currentStep > 1) setCurrentStep(currentStep - 1);
                    else if (selectedProvider) setSelectedProvider(null);
                    }}
                    disabled={currentStep === 1 && !selectedProvider}
                    className={`flex items-center py-2.5 px-5 rounded-xl font-medium transition-all duration-200 ${
                    currentStep === 1 && !selectedProvider
                        ? "bg-gray-800/70 cursor-not-allowed text-gray-500"
                        : "bg-gray-800 hover:bg-gray-700/80 active:scale-95 text-gray-200 shadow-md"
                    }`}
                >
                    <ChevronLeft size={18} className="mr-1" /> Back
                </button>
                {/* Only show the Continue button if we are NOT on Step 2 */}
                {currentStep !== 2 && (
                    <button
                    onClick={() => {
                        if (currentStep === 1 && formValid && canUseExisting) {
                        setCurrentStep(2);
                        } else if (currentStep === 2 && canSelectModules) {
                        setCurrentStep(3);
                        } else if (currentStep === 3 && moduleValid && canSelectModules) {
                        setCurrentStep(4);
                        } else if (currentStep === 4 && canReview) {
                        setCurrentStep(5);
                        }
                    }}
                    disabled={
                        (currentStep === 1 && (!formValid || !canUseExisting)) ||
                        (currentStep === 2 && !canSelectModules) ||
                        (currentStep === 3 && (!moduleValid || !canSelectModules)) ||
                        (currentStep === 4 && !canReview)
                    }
                    className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] shadow-lg ${
                        ((currentStep === 1 && !formValid) || (currentStep === 2 && !moduleValid))
                        ? "bg-gradient-to-r from-gray-700/80 to-gray-800/80 opacity-60 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 shadow-orange-500/25"
                    }`}
                    >
                    {currentStep === 1 ? "Continue" :
                        currentStep === 3 ? "Continue" :
                        currentStep < 5 ? "Continue" : "Review & Deploy"}
                    <ChevronRight size={18} className="ml-1" />
                    </button>
                )}
                </div>
            )}
            </div>
        </div>
        </div>
    );
    };

    export default CloudWorkflow;