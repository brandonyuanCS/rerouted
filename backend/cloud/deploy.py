"""
Deploy the Lambda function to AWS.
Run: python deploy.py

Prerequisites:
1. AWS CLI configured with credentials: aws configure
2. boto3 installed: pip install boto3
"""

import boto3
import json
import os
import shutil
import zipfile
from pathlib import Path


# Configuration
FUNCTION_NAME = "crew-optimizer"
REGION = "us-east-2"  # Must match your aws configure region
MEMORY_MB = 3008  # Max allowed without special request (gives 2 vCPUs)
TIMEOUT_SECONDS = 60
RUNTIME = "python3.11"
HANDLER = "lambda_handler.handler"


def get_backend_dir() -> Path:
    """Get backend directory path."""
    return Path(__file__).parent.parent


def create_deployment_package() -> Path:
    """Create a deployment ZIP package."""
    backend_dir = get_backend_dir()
    cloud_dir = backend_dir / "cloud"
    package_dir = cloud_dir / "package"
    zip_path = cloud_dir / "lambda_package.zip"
    
    # Clean up previous package
    if package_dir.exists():
        shutil.rmtree(package_dir)
    if zip_path.exists():
        zip_path.unlink()
    
    # Create package directory
    package_dir.mkdir(parents=True)
    
    # Copy lambda handler
    shutil.copy(cloud_dir / "lambda_handler.py", package_dir / "lambda_handler.py")
    
    # Copy optimizer module
    optimizer_src = backend_dir / "optimizer"
    optimizer_dst = package_dir / "optimizer"
    shutil.copytree(optimizer_src, optimizer_dst, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    
    # Copy utils module (required by optimizer/constraints.py)
    utils_src = backend_dir / "utils"
    utils_dst = package_dir / "utils"
    shutil.copytree(utils_src, utils_dst, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    
    # Create ZIP
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for file_path in package_dir.rglob("*"):
            if file_path.is_file():
                arcname = file_path.relative_to(package_dir)
                zf.write(file_path, arcname)
    
    # Clean up package directory
    shutil.rmtree(package_dir)
    
    print(f"✓ Created deployment package: {zip_path}")
    print(f"  Size: {zip_path.stat().st_size / 1024 / 1024:.2f} MB")
    
    return zip_path


def get_or_create_role() -> str:
    """Get or create the Lambda execution role."""
    iam = boto3.client("iam")
    role_name = "crew-optimizer-lambda-role"
    
    try:
        response = iam.get_role(RoleName=role_name)
        print(f"✓ Using existing IAM role: {role_name}")
        return response["Role"]["Arn"]
    except iam.exceptions.NoSuchEntityException:
        pass
    
    # Create role
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }
        ]
    }
    
    response = iam.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=json.dumps(trust_policy),
        Description="Execution role for crew optimizer Lambda"
    )
    
    # Attach basic execution policy
    iam.attach_role_policy(
        RoleName=role_name,
        PolicyArn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    )
    
    print(f"✓ Created IAM role: {role_name}")
    print("  (Note: Role may take a few seconds to propagate)")
    
    # Wait for role to propagate
    import time
    time.sleep(10)
    
    return response["Role"]["Arn"]


def deploy_function(zip_path: Path, role_arn: str) -> None:
    """Deploy or update the Lambda function."""
    lambda_client = boto3.client("lambda", region_name=REGION)
    
    with open(zip_path, "rb") as f:
        zip_bytes = f.read()
    
    try:
        # Try to update existing function
        lambda_client.update_function_code(
            FunctionName=FUNCTION_NAME,
            ZipFile=zip_bytes,
        )
        
        # Update configuration
        lambda_client.update_function_configuration(
            FunctionName=FUNCTION_NAME,
            MemorySize=MEMORY_MB,
            Timeout=TIMEOUT_SECONDS,
        )
        
        print(f"✓ Updated Lambda function: {FUNCTION_NAME}")
        
    except lambda_client.exceptions.ResourceNotFoundException:
        # Create new function
        lambda_client.create_function(
            FunctionName=FUNCTION_NAME,
            Runtime=RUNTIME,
            Role=role_arn,
            Handler=HANDLER,
            Code={"ZipFile": zip_bytes},
            MemorySize=MEMORY_MB,
            Timeout=TIMEOUT_SECONDS,
            Description="Crew recovery optimizer with parallel tabu search",
        )
        
        print(f"✓ Created Lambda function: {FUNCTION_NAME}")
    
    print(f"  Memory: {MEMORY_MB} MB (6 vCPUs)")
    print(f"  Timeout: {TIMEOUT_SECONDS} seconds")
    print(f"  Region: {REGION}")


def test_invoke() -> None:
    """Test the deployed function with minimal data."""
    lambda_client = boto3.client("lambda", region_name=REGION)
    
    test_payload = {
        "crew": [],
        "flights": [],
        "pairings": [],
        "disruptions": [],
        "affected_crew": [],
        "config": {"num_workers": 2, "timeout_seconds": 5.0}
    }
    
    print("\n⏳ Testing Lambda invocation...")
    
    response = lambda_client.invoke(
        FunctionName=FUNCTION_NAME,
        InvocationType="RequestResponse",
        Payload=json.dumps(test_payload),
    )
    
    result = json.loads(response["Payload"].read())
    
    if result.get("statusCode") == 200:
        print("✓ Lambda test successful!")
        body = result["body"]
        print(f"  Workers used: {body.get('workers_used', 'N/A')}")
        print(f"  Execution context: {body.get('execution_context', {}).get('function_name', 'N/A')}")
    else:
        print("✗ Lambda test failed!")
        print(f"  Error: {result}")


def main():
    """Main deployment script."""
    print("=" * 50)
    print("Crew Optimizer Lambda Deployment")
    print("=" * 50)
    print()
    
    # Create package
    zip_path = create_deployment_package()
    
    # Get or create IAM role
    role_arn = get_or_create_role()
    
    # Deploy function
    deploy_function(zip_path, role_arn)
    
    # Test invoke
    test_invoke()
    
    print()
    print("=" * 50)
    print("Deployment complete!")
    print()
    print("Next steps:")
    print("1. Add to backend/.env:")
    print("   USE_CLOUD_COMPUTE=true")
    print(f"   LAMBDA_FUNCTION_NAME={FUNCTION_NAME}")
    print(f"   AWS_REGION={REGION}")
    print()
    print("2. Install boto3 in backend:")
    print("   pip install boto3")
    print()
    print("3. Restart the backend server")
    print("=" * 50)


if __name__ == "__main__":
    main()
