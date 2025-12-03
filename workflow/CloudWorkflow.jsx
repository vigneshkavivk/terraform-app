// src/components/workflow/CloudWorkflow.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import ProviderSelector from './ProviderSelector';
import ConnectionForm from './ConnectionForm';
import ModuleSelector from './ModuleSelector';
import ConfigureSummary from './ConfigureSummary';
import CreateStep from './CreateStep';
import CreatedResources from './CreatedResources'; // Import the new component
import { ChevronLeft, ChevronRight } from "lucide-react";
import { providers, modules } from './constants';

const CloudWorkflow = () => {
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
                    if (accounts.length > 0 && !selectedAccount) {
                        setSelectedAccount(accounts[0]);
                        setUsingExistingAccount(true);
                    }
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
        const stepPaths = ['connection', 'module', 'configure', 'create'];
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
            if (dynamicPricing[moduleId]) {
                if (moduleId === "ec2") {
                    const instanceType = config.instanceType || "t2.micro";
                    const hourlyPrice = dynamicPricing.ec2[instanceType] || 0;
                    totalCost += hourlyPrice * 730;
                } else if (moduleId === "s3") {
                    const storageClass = config.storageClass || "STANDARD";
                    const hourlyPrice = dynamicPricing.s3[storageClass] || 0;
                    totalCost += hourlyPrice * 730;
                } else if (moduleId === "vpc") {
                    const natGatewayHourlyPrice = dynamicPricing.vpc?.natGateway || 0;
                    totalCost += natGatewayHourlyPrice * 730;
                }
            } else {
                const module = modules[selectedProvider].find(m => m.id === moduleId);
                if (module && module.price) {
                    totalCost += Object.values(module.price).reduce((sum, p) => sum + p, 0) * 730;
                }
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
            navigate('/clusters/create');
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
                if (accounts.length > 0) {
                setSelectedAccount(accounts[0]);
                setUsingExistingAccount(true);
                setFormData(prev => ({ ...prev, region: accounts[0].awsRegion }));
                }
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
            if (freshAccounts.length > 0) {
                setSelectedAccount(freshAccounts[0]);
                setUsingExistingAccount(true);
                setFormData(prev => ({ ...prev, region: freshAccounts[0].awsRegion }));
            }
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
            calculateEstimatedCost();
            generateIaCPreview();
        }
    }, [selectedProvider, selectedModules, currentStep, formData.region, moduleConfig, dynamicPricing]);

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
            } else if (moduleId === "ecr") {
                isValid = config.name;
            } else if (moduleId === "iam") {
                const hasUser = config.create_user === true && config.user_name?.trim();
                const hasRole = config.create_role === true && config.role_name?.trim() && config.assume_role_policy?.trim();
                isValid = hasUser || hasRole;
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
            }}

            else if (moduleId === "dynamodb") {
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
                    <ModuleSelector
                        selectedProvider={selectedProvider}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedModules={selectedModules}
                        toggleModule={toggleModule}
                        moduleConfig={moduleConfig}
                        setModuleConfig={setModuleConfig}
                        vpcs={vpcs}
                    />
                );
            case 3:
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
            case 4:
                return (
                    <CreateStep
                        isCreated={isCreated}
                        selectedProvider={selectedProvider}
                        formData={formData}
                        selectedModules={selectedModules}
                        estimatedCost={estimatedCost}
                        deploymentLogs={deploymentLogs}
                        loading={loading}
                        onDeploy={handleSubmit}
                        onReset={handleReset}
                        onBack={() => setCurrentStep(3)}
                    />
                );
            default:
                return null;
        }
    };

    // Steps definition
    const steps = [
        { id: 1, name: "Connection" },
        { id: 2, name: "Modules" },
        { id: 3, name: "Configure" },
        { id: 4, name: "Create" },
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
                    {currentStep === 2 && "Select which modules to deploy in your environment."}
                    {currentStep === 3 && "Review configuration, pricing, and infrastructure-as-code preview."}
                    {currentStep === 4 && !isCreated && "Ready to deploy your resources. This may take 2–5 minutes."}
                    {currentStep === 4 && isCreated && "✅ Your infrastructure has been successfully deployed!"}
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
                            {/* Add an icon for Configure and Create steps */}
                            {step.id === 3 && <span className="text-xs mt-1">⚙️</span>}
                            {step.id === 4 && <span className="text-xs mt-1">🚀</span>}
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
                    {selectedProvider && currentStep !== 4 && (
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
                            <button
                                onClick={() => {
                                    if (currentStep === 1 && formValid) setCurrentStep(2);
                                    else if (currentStep === 2 && moduleValid) setCurrentStep(3);
                                    else if (currentStep === 3) setCurrentStep(4);
                                }}
                                disabled={
                                    (currentStep === 1 && !formValid) ||
                                    (currentStep === 2 && !moduleValid)
                                }
                                className={`flex items-center gap-2 py-2.5 px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.98] shadow-lg ${
                                    ((currentStep === 1 && !formValid) || (currentStep === 2 && !moduleValid))
                                      ? "bg-gradient-to-r from-gray-700/80 to-gray-800/80 opacity-60 cursor-not-allowed"
                                      : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 shadow-orange-500/25"
                                }`}
                            >
                                {currentStep < 3 ? "Continue" : "Review & Deploy"} 
                                <ChevronRight size={18} className="ml-1" />
                            </button>
                        </div>
                    )}
                </div>
                {/* ===== NEW: Created Resources Section ONLY on Step 2 ===== */}
                {currentStep === 2 && (
                    <div className="mt-10">
                        <CreatedResources />
                    </div>
                )}
            </div>
        </div>
    );
}; 
      
export default CloudWorkflow;   
