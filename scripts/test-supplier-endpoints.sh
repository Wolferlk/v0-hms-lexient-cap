#!/bin/bash
# Test script to verify wedding supplier endpoints
# Run: bash scripts/test-supplier-endpoints.sh

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "Testing Wedding Supplier API Endpoints"
echo "======================================="
echo "Base URL: $BASE_URL"
echo ""

# 1. Create Supplier
echo "1️⃣  Creating Supplier..."
SUPPLIER_JSON=$(curl -s -X POST "$BASE_URL/api/inventory/suppliers" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test DJ Services",
    "contactPerson": "John DJ",
    "email": "john@djservices.com",
    "phone": "555-1234",
    "address": "123 Music Street",
    "city": "Nashville",
    "state": "TN",
    "zipCode": "37201",
    "paymentTerms": "COD",
    "rating": 5
  }')

echo "Response: $SUPPLIER_JSON"
SUPPLIER_ID=$(echo "$SUPPLIER_JSON" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
if [ -z "$SUPPLIER_ID" ]; then
  SUPPLIER_ID=$(echo "$SUPPLIER_JSON" | grep -o '"_id" *: *"[^"]*' | cut -d'"' -f4)
fi
echo "Supplier ID: $SUPPLIER_ID"
echo ""

# 2. Get Suppliers
echo "2️⃣  Fetching Suppliers List..."
SUPPLIERS_LIST=$(curl -s "$BASE_URL/api/inventory/suppliers?activeOnly=true&limit=100")
echo "Response: $(echo $SUPPLIERS_LIST | head -c 200)..."
echo ""

# 3. Create Supplier Package
if [ ! -z "$SUPPLIER_ID" ]; then
  echo "3️⃣  Creating Supplier Package..."
  PACKAGE_JSON=$(curl -s -X POST "$BASE_URL/api/wedding-hall/supplier-packages" \
    -H "Content-Type: application/json" \
    -d "{
      \"supplierId\": \"$SUPPLIER_ID\",
      \"packageType\": \"dj\",
      \"packageName\": \"Premium DJ Package\",
      \"description\": \"Full day DJ service with sound system\",
      \"price\": 2500
    }")
  
  echo "Response: $PACKAGE_JSON"
  PACKAGE_ID=$(echo "$PACKAGE_JSON" | grep -o '"_id":"[^"]*' | cut -d'"' -f4)
  if [ -z "$PACKAGE_ID" ]; then
    PACKAGE_ID=$(echo "$PACKAGE_JSON" | grep -o '"_id" *: *"[^"]*' | cut -d'"' -f4)
  fi
  echo "Package ID: $PACKAGE_ID"
  echo ""

  # 4. Get Supplier Packages
  echo "4️⃣  Fetching Supplier Packages..."
  PACKAGES_LIST=$(curl -s "$BASE_URL/api/wedding-hall/supplier-packages?activeOnly=true")
  echo "Response: $(echo $PACKAGES_LIST | head -c 200)..."
  echo ""

  # 5. Edit Supplier
  echo "5️⃣  Editing Supplier..."
  EDIT_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/inventory/suppliers" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"$SUPPLIER_ID\",
      \"name\": \"Test DJ Services - Updated\",
      \"rating\": 4.5
    }")
  echo "Response: $EDIT_RESPONSE"
  echo ""

  # 6. Edit Supplier Package
  if [ ! -z "$PACKAGE_ID" ]; then
    echo "6️⃣  Editing Supplier Package..."
    EDIT_PKG=$(curl -s -X PUT "$BASE_URL/api/wedding-hall/supplier-packages" \
      -H "Content-Type: application/json" \
      -d "{
        \"id\": \"$PACKAGE_ID\",
        \"price\": 3000,
        \"description\": \"Premium DJ with MC service\"
      }")
    echo "Response: $EDIT_PKG"
    echo ""
  fi

  # 7. Delete Supplier Package
  if [ ! -z "$PACKAGE_ID" ]; then
    echo "7️⃣  Deleting Supplier Package..."
    DELETE_PKG=$(curl -s -X DELETE "$BASE_URL/api/wedding-hall/supplier-packages?id=$PACKAGE_ID")
    echo "Response: $DELETE_PKG"
    echo ""
  fi

  # 8. Delete Supplier
  echo "8️⃣  Deleting Supplier..."
  DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/inventory/suppliers?id=$SUPPLIER_ID")
  echo "Response: $DELETE_RESPONSE"
  echo ""

  echo "✅ Test completed!"
else
  echo "❌ Failed to create supplier, cannot continue with tests"
  exit 1
fi
