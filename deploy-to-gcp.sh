#!/bin/bash

# LoopJS C2 Server and Web Panel Deployment Script for Google Cloud Run
# This script deploys both backend and frontend services to Google Cloud Run

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    print_status "Checking requirements..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All requirements satisfied."
}

# Get project configuration
get_project_config() {
    print_status "Getting project configuration..."
    
    # Get current project ID
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "No project set. Please run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    print_success "Using project: $PROJECT_ID"
    
    # Set region (you can modify this)
    REGION="us-central1"
    print_status "Using region: $REGION"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    
    print_success "APIs enabled successfully."
}

# Create secrets in Secret Manager
create_secrets() {
    print_status "Creating secrets in Secret Manager..."
    
    # Check if .env file exists
    if [ ! -f "backend/.env" ]; then
        print_error "backend/.env file not found. Please create it with your environment variables."
        exit 1
    fi
    
    # Read environment variables from .env file
    source backend/.env
    
    # Create secrets
    echo "$MONGO_URI" | gcloud secrets create MONGO_URI --data-file=- --replication-policy="automatic" || print_warning "MONGO_URI secret already exists"
    echo "$JWT_SECRET" | gcloud secrets create JWT_SECRET --data-file=- --replication-policy="automatic" || print_warning "JWT_SECRET secret already exists"
    echo "$SESSION_SECRET" | gcloud secrets create SESSION_SECRET --data-file=- --replication-policy="automatic" || print_warning "SESSION_SECRET secret already exists"
    
    print_success "Secrets created successfully."
}

# Deploy backend service
deploy_backend() {
    print_status "Deploying backend service..."
    
    cd backend
    
    # Submit build to Cloud Build
    gcloud builds submit --config=cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD) .
    
    cd ..
    
    print_success "Backend service deployed successfully."
}

# Deploy frontend service
deploy_frontend() {
    print_status "Deploying frontend service..."
    
    cd frontend
    
    # Submit build to Cloud Build
    gcloud builds submit --config=cloudbuild.yaml --substitutions=COMMIT_SHA=$(git rev-parse --short HEAD) .
    
    cd ..
    
    print_success "Frontend service deployed successfully."
}

# Get service URLs
get_service_urls() {
    print_status "Getting service URLs..."
    
    BACKEND_URL=$(gcloud run services describe loopjs-backend --region=$REGION --format='value(status.url)')
    FRONTEND_URL=$(gcloud run services describe loopjs-frontend --region=$REGION --format='value(status.url)')
    
    print_success "Deployment completed successfully!"
    echo ""
    echo "=== Service URLs ==="
    echo "Backend (C2 Server): $BACKEND_URL"
    echo "Frontend (Web Panel): $FRONTEND_URL"
    echo ""
    echo "=== Next Steps ==="
    echo "1. Update your frontend configuration to use the backend URL: $BACKEND_URL"
    echo "2. Configure your stealth clients to connect to: $BACKEND_URL"
    echo "3. Access the web panel at: $FRONTEND_URL"
    echo ""
}

# Main deployment function
main() {
    print_status "Starting LoopJS deployment to Google Cloud Run..."
    
    check_requirements
    get_project_config
    enable_apis
    create_secrets
    deploy_backend
    deploy_frontend
    get_service_urls
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@"