# TEST SIGN-UP SIGN-IN FORGOT PASSWORD
# ----- Setup -----
BASE=https://donney.ddns.net/api
JAR="cookies.txt"
rm -f "$JAR"

# Get CSRF cookie
curl -s -X GET "$BASE/auth/csrf/" -c "$JAR" > /dev/null
CSRF=$(awk '$6=="csrftoken"{print $7}' "$JAR")
echo "CSRF=$CSRF"

# ----- signup -----
curl -i -X POST "$BASE/auth/signup/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  --cookie "csrftoken=$CSRF" \
  -d '{
    "username":"testuser4",
    "password":"SecurePass123!",
    "email":"testuser4@example.com",
    "first_name":"Test",
    "last_name":"User",
    "street_name":"Main",
    "street_number":"12",
    "city":"Toronto",
    "country":"CA",
    "postal_code":"M1M1M1"
  }'

** TEST already taken username  *
curl -i -X POST "$BASE/auth/signup/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  --cookie "csrftoken=$CSRF" \
  -d '{
    "username":"testuser3",
    "password":"SecurePass123!",
    "email":"testuser4@example.com",
    "first_name":"Test",
    "last_name":"User",
    "street_name":"Main",
    "street_number":"12",
    "city":"Toronto",
    "country":"CA",
    "postal_code":"M1M1M1"
  }'

# ----- login (you can use username or email in identifier) -----
# (also save cookies so we can read sessionid)
curl -i -X POST "$BASE/auth/login/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" -c "$JAR" \
  -d '{"identifier":"testuser4","password":"SecurePass123!"}'

  ** TEST invalid credentials**
  curl -i -X POST "$BASE/auth/login/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" -c "$JAR" \
  -d '{"identifier":"testuser4","password":"12345678"}'

# Copy sessionid from Set-Cookie (saved to cookie jar above)
SESSION=$(awk '$6=="sessionid"{print $7}' "$JAR")
echo "SESSION=$SESSION"

# ----- who am i (/auth/me) -----
# (either use the sessionid directly…)
curl -i "$BASE/auth/me/" --cookie "sessionid=$SESSION"
# …or just use the cookie jar:
# curl -i -b "$JAR" "$BASE/auth/me/"

# ----- logout -----
curl -i -X POST "$BASE/auth/logout/" \
  -H "X-CSRFToken: $CSRF" \
  --cookie "csrftoken=$CSRF; sessionid=$SESSION"

# ----- Password Reset -----
# ---------- Setup ----------
rm -f "$JAR"

# Get CSRF cookie (needed for POSTs)
curl -s -X GET "$BASE/auth/csrf/" -c "$JAR" > /dev/null
CSRF=$(awk '$6=="csrftoken"{print $7}' "$JAR")
echo "CSRF=$CSRF"

# ---- by email (recommended) ----
RESP=$(curl -s -X POST "$BASE/auth/password-reset/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" \
  -d '{"email":"testuser4@example.com"}')

# (Alternative: by username)
# RESP=$(curl -s -X POST "$BASE/auth/password-reset/" \
#   -H "Content-Type: application/json" \
#   -H "X-CSRFToken: $CSRF" \
#   -b "$JAR" \
#   -d '{"username":"testuser4"}')

echo "$RESP"

# In dev, the endpoint returns {"ok": true, "reset_url": "…?uid=...&token=..."}.
# Extract the link, uid, and token:
RESET_URL=$(printf '%s' "$RESP" | sed -n 's/.*"reset_url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
echo "RESET_URL=$RESET_URL"

RESET_UID=$(printf '%s' "$RESET_URL"   | sed -n 's/.*[?&]uid=\([^&]*\).*/\1/p')
RESET_TOKEN=$(printf '%s' "$RESET_URL" | sed -n 's/.*[?&]token=\([^&]*\).*/\1/p')
echo "RESET_UID=$RESET_UID"
echo "RESET_TOKEN=$RESET_TOKEN"

# set new password
curl -i -X POST "$BASE/auth/password-reset-confirm/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  --cookie "csrftoken=$CSRF" \
  -d '{"uid":"'"$RESET_UID"'","token":"'"$RESET_TOKEN"'","new_password":"SecurePass1234!"}'

# Log in with new password
#   save cookies (sessionid) into the jar
curl -i -X POST "$BASE/auth/login/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" -c "$JAR" \
  -d '{"identifier":"testuser4","password":"SecurePass1234!"}'

  ** TEST login with old password **
  curl -i -X POST "$BASE/auth/login/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" -c "$JAR" \
  -d '{"identifier":"testuser4","password":"SecurePass123!"}'

# Sanity check who you are
curl -i -b "$JAR" "$BASE/auth/me/"

# if you want to log out
SESSION=$(awk '$6=="sessionid"{print $7}' "$JAR")
echo "SESSION=$SESSION"

curl -i -X POST "$BASE/auth/logout/" \
  -H "X-CSRFToken: $CSRF" \
  --cookie "csrftoken=$CSRF; sessionid=$SESSION"


# TEST SEARCH ITEM, CREATE ITEM, GET ITEM DETAILS, PLACE BID, GET CURRENT PRICE, GET AUCTION STATUS

# ** IF YOU WANT TO PLACE A BID YOU HAVE TO SIGN IN TO ANOTHER ACCOUNT.
#    FOLLOW PREVIOUS STEPS TO LOG IN TO USER: testuser3 PASS: SecurePass1234! THEN GET ITEM ID AND PLACE BID (SEE BELOW) **

# CREATE ITEM

# refresh csrf after log in
curl -s "$BASE/auth/csrf/" -b "$JAR" -c "$JAR" > /dev/null
CSRF=$(awk '/csrftoken/ {print $7}' "$JAR")
curl -i "$BASE/auth/me/" -b "$JAR"

# create the item
# macOS (BSD date) – ends in 10 minutes:
END_AT=$(date -u -v+10M +"%Y-%m-%dT%H:%M:%SZ")
echo "END_AT=$END_AT"

curl -i -X POST "$BASE/items/create/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" -c "$JAR" \
  -d "{
        \"name\":\"Test Item4\",
        \"description\":\"Great condition\",
        \"starting_price\":\"10.00\",
        \"auction_type\":\"FORWARD\",
        \"end_time\":\"$END_AT\",
        \"standard_shipping_cost\":\"15.00\",
        \"expedited_shipping_cost\":\"20.00\"
      }"

** TEST missing field **
curl -i -X POST "$BASE/items/create/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" -c "$JAR" \
  -d "{
        \"name\":\"Test Item4\",
        \"description\":\"Great condition\",
        \"auction_type\":\"FORWARD\",
        \"end_time\":\"$END_AT\",
        \"standard_shipping_cost\":\"15.00\",
        \"expedited_shipping_cost\":\"20.00\"
      }"

# Display all items
curl -s "$BASE/items/"

# Display all items with filters
curl -s "$BASE/items/?status=active"
curl -s "$BASE/items/?type=FORWARD&sort=ending_soon"
curl -s "$BASE/items/?q=shoe&page=2&page_size=10"

# search active auctions by keyword
curl -s "$BASE/items/search/?keyword=Test" -b "$JAR"

# get item id
ITEM_ID=$(curl -s "$BASE/items/search/?keyword=Test%20Item4" -b "$JAR" | sed -n 's/.*"id"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p' | head -1)
echo "ITEM_ID=$ITEM_ID"

# GET ITEM DETAIL
curl -i "$BASE/items/$ITEM_ID/" -b "$JAR"

# BEFORE PLACING BID, OPEN NEW TERMINAL WINDOW AND, GET CSRF TOKEN AND SESSION ID (SEE PREVIOUS COMMANDS) LOGIN AS USER:testuser3 PASS:SecurePass1234! THEN REFRESH CSRF TOKEN (SEE ABOVE) NOW YOU CAN PLACE A BID
# PLACE BID
curl -i -X POST "$BASE/items/$ITEM_ID/bid/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" -c "$JAR" \
  -d '{"bid_amount":"14"}'

** TEST place bid less than starting price **
curl -i -X POST "$BASE/items/$ITEM_ID/bid/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  -b "$JAR" -c "$JAR" \
  -d '{"bid_amount":"7"}'

# POLL CURRENT PRICE
curl -i "$BASE/items/$ITEM_ID/current-price/" -b "$JAR"

# GET AUCTION STATUS
curl -i "$BASE/items/$ITEM_ID/status/" -b "$JAR"

# PAYMENTS

# get won items
curl -i "$BASE/payments/my-won-items/" -b "$JAR"

# set ITEM_ID to id of item that you bid on and won (can find in output of above command)

# get payment details
curl -i "$BASE/payments/$ITEM_ID/details/" -b "$JAR"

# process payment
CSRF=$(awk '/csrftoken/ {print $7}' "$JAR" | tail -1)

curl -i -X POST "$BASE/payments/$ITEM_ID/pay/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  --cookie "csrftoken=$CSRF" \
  -b "$JAR" -c "$JAR" \
  -d '{
    "expedited_shipping": false,
    "payment_method": "Credit Card",
    "card_number": "4242424242424242",
    "name_on_card": "Test User",
    "expiration_date": "02/26",
    "security_code": "321"
  }'

  ** TEST missing card number **
  CSRF=$(awk '/csrftoken/ {print $7}' "$JAR" | tail -1)

curl -i -X POST "$BASE/payments/$ITEM_ID/pay/" \
  -H "Content-Type: application/json" \
  -H "X-CSRFToken: $CSRF" \
  --cookie "csrftoken=$CSRF" \
  -b "$JAR" -c "$JAR" \
  -d '{
    "expedited_shipping": false,
    "payment_method": "Credit Card",
    "name_on_card": "Test User",
    "expiration_date": "02/26",
    "security_code": "321"
  }'