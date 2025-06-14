#!/bin/bash

# Colors for output
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Installing VS Blue...${NC}"

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo -e "${RED}❌ VS Code is not installed. Please install VS Code first.${NC}"
    exit 1
fi

# Create temp directory
TEMP_DIR=$(mktemp -d)
cd $TEMP_DIR

# Download the latest release
echo -e "${BLUE}📥 Downloading VS Blue...${NC}"
curl -L -o vs-blue.vsix https://github.com/yourusername/vs-blue/releases/latest/download/vs-blue.vsix

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to download VS Blue${NC}"
    exit 1
fi

# Install the extension
echo -e "${BLUE}📦 Installing extension...${NC}"
code --install-extension vs-blue.vsix

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ VS Blue installed successfully!${NC}"
    echo -e "${BLUE}💡 Quick Start:${NC}"
    echo -e "1. Press ${BLUE}Cmd+Shift+P${NC}"
    echo -e "2. Type ${BLUE}VS Blue: Toggle Performance HUD${NC}"
    echo -e "3. Enjoy your optimized VS Code! 🚀"
else
    echo -e "${RED}❌ Failed to install VS Blue${NC}"
    exit 1
fi

# Cleanup
cd - > /dev/null
rm -rf $TEMP_DIR
