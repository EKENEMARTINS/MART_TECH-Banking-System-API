# MART_TECH Banking System

MART_TECH Banking System is a backend digital banking application built with Node.js, Express.js, and MongoDB.

The application integrates with the NIBSS by Phoenix API to provide customer onboarding, account creation, name enquiry, balance enquiry, intra-bank transfers, inter-bank transfers, transaction status queries, and transaction history.

This project was developed as part of the TS Academy Backend Engineering Digital Banking System assignment.

---

## Features

The system provides:

- Customer registration
- Customer login
- JWT authentication
- Password hashing
- Simulated BVN onboarding
- Simulated NIN onboarding
- BVN/NIN identity verification
- Account creation after successful KYC
- Maximum of one account per customer
- ₦15,000 opening balance through NIBSS
- Account information retrieval
- Account balance enquiry
- Name enquiry
- Self-transfer prevention
- Intra-bank transfers
- Inter-bank transfers
- Transaction Status Query (TSQ)
- DEBIT transaction history
- CREDIT transaction history for locally processed incoming transfers
- Customer data isolation
- NIBSS authentication and integration

---

## Technology Stack

The application uses:

- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Token (JWT)
- bcryptjs
- Axios
- dotenv
- CORS
- NIBSS by Phoenix API

---

## Project Structure

```text
MART_TECH/
│
├── Config/
│   └── db.js
│
├── Controllers/
│   ├── AuthController.js
│   ├── OnboardingController.js
│   ├── AccountController.js
│   └── TransactionController.js
│
├── Middleware/
│   └── auth.js
│
├── Models/
│   ├── User.js
│   ├── Account.js
│   └── Transaction.js
│
├── Routes/
│   ├── AuthRoute.js
│   ├── OnboardingRoute.js
│   ├── AccountRoute.js
│   └── TransactionRoute.js
│
├── Services/
│   └── NibssService.js
│
├── Postman/
│   └── MART_TECH-Banking-API.postman_collection.json
│
├── .env
├── .env.example
├── .gitignore
├── README.md
├── app.js
├── package.json
└── package-lock.json
```

---

## System Architecture

The application uses two separate authentication systems:

1. Customer authentication with MART_TECH.
2. MART_TECH authentication with NIBSS by Phoenix.

```text
Customer
   |
   | Customer JWT
   v
MART_TECH Banking API
   |
   | NIBSS JWT
   v
NIBSS by Phoenix
```

These authentication systems are separate.

Customers never receive the NIBSS API key, API secret, or NIBSS JWT.

---

## Customer Authentication

Customers register and login through the MART_TECH API.

After successful login, the application returns a customer JWT.

Protected endpoints require:

```text
Authorization: Bearer <customer_jwt>
```

The customer's JWT is used by the backend to determine which customer is making a request.

---

## NIBSS Authentication

MART_TECH authenticates with NIBSS by Phoenix using the API key and API secret assigned during fintech onboarding.

The NIBSS authentication endpoint is:

```text
POST /api/auth/token
```

The NIBSS JWT is used internally when communicating with protected NIBSS endpoints.

The NIBSS token is not exposed to MART_TECH customers.

---

## Customer Onboarding Flow

Customers must complete KYC before they can create a bank account.

The onboarding flow is:

```text
Customer Registration
        |
        v
Customer Login
        |
        v
Create Simulated BVN or NIN
        |
        v
Validate Identity Through NIBSS
        |
        v
Compare Identity Information
        |
        v
Customer Marked Verified
        |
        v
Account Creation Allowed
        |
        v
NIBSS Creates Bank Account
        |
        v
₦15,000 Opening Balance
```

A customer cannot create an account unless either BVN or NIN onboarding has been completed successfully.

Only simulated BVN and NIN values should be used with this application.

---

## One Account Per Customer

Each customer can have a maximum of one bank account.

Before account creation, the application checks whether the authenticated customer already owns an account.

The restriction is also enforced in MongoDB:

```js
customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
}
```

This provides application-level and database-level protection against multiple accounts being created for the same customer.

---

## Installation

### 1. Clone the Repository

```bash
git clone <[YOUR-GITHUB-REPOSITORY-URL](https://github.com/EKENEMARTINS/MART_TECH-Banking-System-API.git)>
```

Move into the application directory:

```bash
cd <YOUR-PROJECT-DIRECTORY>
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=9000

MONGODB_URI=mongodb://127.0.0.1:27017/MART_TECHBankingSystem

JWT_SECRET=your_private_jwt_secret
JWT_EXPIRES_IN=1d

NIBSS_BASE_URL=https://nibssbyphoenix.onrender.com

NIBSS_API_KEY=your_nibss_api_key
NIBSS_API_SECRET=your_nibss_api_secret

BANK_CODE=your_assigned_bank_code
BANK_NAME=your_assigned_bank_name
```

Never commit the real `.env` file to GitHub.

A `.env.example` file should be provided with empty values:

```env
PORT=9000

MONGODB_URI=

JWT_SECRET=
JWT_EXPIRES_IN=1d

NIBSS_BASE_URL=https://nibssbyphoenix.onrender.com

NIBSS_API_KEY=
NIBSS_API_SECRET=

BANK_CODE=
BANK_NAME=
```

---

### 4. Start MongoDB

Ensure your MongoDB database is running.

For a local database, the application can use:

```text
mongodb://127.0.0.1:27017/marttech_bank
```

---

### 5. Start the Application

Development mode:

```bash
npm run dev
```

Production/start mode:

```bash
npm start
```

The server runs by default at:

```text
http://localhost:9000
```

---

## API Health Check

```http
GET /
```

Example response:

```json
{
    "success": true,
    "message": "MART_TECH Banking System API is running"
}
```

---

## API Endpoints

## Authentication

```text
POST /auth/register
POST /auth/login
```

## Customer Onboarding

```text
POST /onboarding/bvn
POST /onboarding/nin
```

## Accounts

```text
POST /account/create
GET  /account/me
GET  /account/balance
GET  /account/name-enquiry/:accountNumber
```

## Transactions

```text
POST /transactions/transfer
GET  /transactions/history
GET  /transactions/status/:transactionId
```

---

### 1. Customer Registration

Endpoint:

```http
POST /auth/register
```

Example URL:

```text
http://localhost:9000/auth/register
```

Example request:

```json
{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "Password123!",
    "phone": "08012345678",
    "dob": "2000-01-15"
}
```

Example successful response:

```json
{
    "message": "Registration successful",
    "token": "<customer_jwt>",
    "user": {
        "id": "<customer_id>",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "isVerified": false
    }
}
```

Customer passwords are hashed before being stored in MongoDB.

---

### 2. Customer Login

Endpoint:

```http
POST /auth/login
```

Example:

```json
{
    "email": "john@example.com",
    "password": "Password123!"
}
```

A successful login returns a JWT.

Example:

```json
{
    "message": "Login successful",
    "token": "<customer_jwt>",
    "user": {
        "id": "<customer_id>",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "isVerified": false,
        "kycType": null
    }
}
```

Use the JWT for protected endpoints:

```text
Authorization: Bearer <customer_jwt>
```

---

### 3. BVN Onboarding

Endpoint:

```http
POST /onboarding/bvn
```

Authentication:

```text
Bearer Token required
```

Example request:

```json
{
    "bvn": "12345678901"
}
```

A simulated 11-digit BVN must be used.

The application:

1. Sends the simulated BVN and customer details to NIBSS.
2. Creates the BVN record.
3. Validates the BVN.
4. Compares the returned name and date of birth with the registered customer.
5. Marks the customer as verified when the details match.

Example response:

```json
{
    "message": "BVN onboarding and verification successful",
    "verified": true,
    "kycType": "bvn"
}
```

---

### 4. NIN Onboarding

Endpoint:

```http
POST /onboarding/nin
```

Authentication:

```text
Bearer Token required
```

Example request:

```json
{
    "nin": "12345678910"
}
```

A simulated 11-digit NIN must be used.

The application creates and validates the simulated NIN through NIBSS.

Example response:

```json
{
    "message": "NIN onboarding and verification successful",
    "verified": true,
    "kycType": "nin"
}
```

A customer only needs to successfully complete either BVN or NIN onboarding.

---

### 5. Account Creation

Endpoint:

```http
POST /account/create
```

Authentication:

```text
Bearer Token required
```

No request body is required.

The backend gets the following information from the authenticated customer's verified profile:

```text
KYC Type
KYC ID
Date of Birth
```

The application first checks:

```text
Is Customer Verified?
       |
       +---- NO ----> Reject
       |
      YES
       |
       v
Does Customer Already Have Account?
       |
       +---- YES ---> Reject
       |
       NO
       |
       v
Create Account Through NIBSS
```

NIBSS creates the account and supplies an opening balance of:

```text
₦15,000
```

Example response:

```json
{
    "message": "Bank account created successfully",
    "account": {
        "accountNumber": "2441234567",
        "accountName": "John Doe",
        "bankCode": "244",
        "bankName": "MAR_Bank",
        "openingBalance": 15000
    }
}
```

---

### 6. Get My Account

Endpoint:

```http
GET /account/me
```

Authentication:

```text
Bearer Token required
```

The application does not accept a customer ID.

The account is retrieved using the authenticated user's identity:

```js
Account.findOne({
    customer: req.user._id
})
```

This prevents customers from retrieving other customers' accounts.

---

### 7. Account Balance

Endpoint:

```http
GET /account/balance
```

Authentication:

```text
Bearer Token required
```

No account number is accepted from the client.

The backend:

1. Determines the customer from their JWT.
2. Gets the customer's linked account.
3. Sends the account number to NIBSS.
4. Returns the current NIBSS balance.

Example:

```json
{
    "message": "Balance retrieved successfully",
    "accountNumber": "2441234567",
    "accountName": "John Doe",
    "balance": 15000
}
```

NIBSS remains the authoritative source for account balances.

---

### 8. Name Enquiry

Endpoint:

```http
GET /account/name-enquiry/:accountNumber
```

Example:

```text
GET /account/name-enquiry/2443147773
```

Authentication:

```text
Bearer Token required
```

Name enquiry allows the customer to verify the recipient before transferring funds.

The NIBSS response can contain:

```text
Account Number
Account Name
Bank Name
Bank Code
```

The bank code also helps determine whether the transfer is intra-bank or inter-bank.

---

### 9. Funds Transfer

Endpoint:

```http
POST /transactions/transfer
```

Authentication:

```text
Bearer Token required
```

Example request:

```json
{
    "to": "2443147773",
    "amount": 500
}
```

The client does NOT submit a `from` account number.

The source account is obtained from the authenticated customer's account.

This prevents a malicious customer from attempting to debit another customer's account.

The transfer workflow is:

```text
Customer Sends Transfer Request
              |
              v
Authenticate Customer
              |
              v
Get Customer's Account
              |
              v
Prevent Self Transfer
              |
              v
Perform Recipient Name Enquiry
              |
              v
Verify Available Balance
              |
              v
Submit Transfer to NIBSS
              |
              v
Receive Transaction Reference
              |
              v
Save Transaction History
```

---

### 10. Self-Transfer Prevention

Customers cannot transfer money from an account back into the same account.

If the authenticated customer owns:

```text
2441163251
```

the following request is rejected:

```json
{
    "to": "2441163251",
    "amount": 1000
}
```

Example response:

```json
{
    "message": "You cannot transfer money to your own account"
}
```

This check happens before the transfer is sent to NIBSS.

---

### 11. Intra-Bank Transfer

An intra-bank transfer occurs when both accounts belong to the same bank.

Example:

```text
MART_TECH Customer A
        |
        | ₦500
        v
MART_TECH Customer B
```

When both customers exist locally:

```text
Customer A History
DEBIT ₦500
       |
       v
Customer B History
CREDIT ₦500
```

The transaction is classified as:

```text
INTRA_BANK
```

---

### 12. Inter-Bank Transfer

An inter-bank transfer occurs when the sender and recipient belong to different banks.

Example:

```text
MART_TECH
    |
    | NIBSS
    v
Another Bank
```

The recipient bank code is compared to the sender's bank code.

Different bank codes result in:

```text
INTER_BANK
```

The application supports both sending money to other NIBSS by Phoenix banks and receiving money at the NIBSS account level.

---

### 13. Transaction History

Endpoint:

```http
GET /transactions/history
```

Authentication:

```text
Bearer Token required
```

Transaction records contain a direction.

For money sent:

```text
DEBIT
```

For money received locally:

```text
CREDIT
```

Example outgoing transaction:

```json
{
    "transactionId": "TX1788885897482",
    "from": "2441163251",
    "to": "2443147773",
    "amount": 500,
    "direction": "DEBIT",
    "recipientName": "Example Recipient",
    "recipientBank": "MART_TECH",
    "transferType": "INTRA_BANK",
    "status": "SUCCESS"
}
```

For the local recipient, a corresponding record can appear as:

```json
{
    "transactionId": "TX1788885897482",
    "from": "2441163251",
    "to": "2443147773",
    "amount": 500,
    "direction": "CREDIT",
    "transferType": "INTRA_BANK",
    "status": "SUCCESS"
}
```

---

### 14. Incoming Transaction History

For transfers between two customers whose accounts are stored locally in MART_TECH:

- The sender receives a `DEBIT` history entry.
- The recipient receives a `CREDIT` history entry.

For an incoming inter-bank transfer initiated completely from another bank's backend, NIBSS updates the receiving customer's account balance.

However, the provided NIBSS by Phoenix documentation does not expose an incoming-transfer webhook or account-wide transaction history endpoint.

Therefore, MART_TECH cannot automatically discover an externally initiated incoming inter-bank transfer for its local MongoDB transaction history.

The NIBSS balance remains authoritative.

---

### 15. Transaction Status Query

Endpoint:

```http
GET /transactions/status/:transactionId
```

Example:

```text
GET /transactions/status/TX1788885897482
```

Authentication:

```text
Bearer Token required
```

Before querying NIBSS, the system verifies that the authenticated customer owns the local transaction:

```js
Transaction.findOne({
    transactionId,
    customer: req.user._id
})
```

If the transaction does not belong to the customer:

```json
{
    "message": "Transaction not found"
}
```

This prevents customers from using another customer's transaction reference to retrieve transaction information.

---

## Transaction Status

NIBSS transactions may have statuses such as:

```text
PENDING
SUCCESS
FAILED
```

The local transaction status is updated when a valid status response is received from NIBSS.

---

## Transaction Direction

Transactions are classified using:

```text
DEBIT
```

or:

```text
CREDIT
```

`DEBIT` means money was sent by the customer.

`CREDIT` means money was received by the customer and the receiving account was identifiable by the local MART_TECH system.

---

## Data Privacy

Data isolation is an important part of the application.

Each customer can access only their own protected banking information.

## Account Privacy

Accounts are retrieved with:

```js
Account.findOne({
    customer: req.user._id
})
```

Customers do not supply another customer's database ID.

## Balance Privacy

The balance endpoint does not allow the customer to provide an arbitrary source account.

The account linked to the authenticated customer is used.

## Transaction History Privacy

Transaction history uses:

```js
Transaction.find({
    customer: req.user._id
})
```

Therefore Customer A cannot retrieve Customer B's transaction history by modifying the request.

## Transaction Status Privacy

Transaction ownership is checked before requesting status from NIBSS:

```js
Transaction.findOne({
    transactionId,
    customer: req.user._id
})
```

## Transfer Security

The sender's account is retrieved with:

```js
Account.findOne({
    customer: req.user._id
})
```

The client only supplies:

```json
{
    "to": "recipient_account",
    "amount": 500
}
```

and cannot choose the account being debited.

---

## Security Measures

The application implements the following security controls:

- Password hashing with bcrypt
- JWT-based customer authentication
- Protected banking routes
- NIBSS JWT authentication
- NIBSS credentials stored in environment variables
- KYC verification before account creation
- Maximum of one account per customer
- Self-transfer prevention
- Source account ownership enforcement
- Transaction ownership verification
- Customer transaction isolation
- Protected KYC data
- Input validation
- Environment secret isolation
- NIBSS token caching and refresh handling

---

## NIBSS by Phoenix Integration

The application integrates with the following NIBSS functionality:

```text
POST /api/auth/token
POST /api/insertBvn
POST /api/validateBvn
POST /api/insertNin
POST /api/validateNin
POST /api/account/create
GET  /api/account/name-enquiry/:accountNumber
GET  /api/account/balance/:accountNumber
POST /api/transfer
GET  /api/transaction/:transactionId
```

The NIBSS API is used as the authoritative banking infrastructure for:

```text
Identity
Accounts
Balances
Transfers
Transaction Status
```

---

## Error Handling

The application handles common errors including:

```text
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Internal Server Error
502 External/NIBSS Service Error
```

Unknown local routes return:

```json
{
    "message": "API endpoint not found"
}
```

NIBSS API errors are normalized before being returned through the MART_TECH API.

Sensitive API credentials and authorization tokens are not intentionally returned in error responses.

---

## Postman Testing

A Postman collection can be used to test the application.

Suggested environment variables:

```text
baseUrl
customerToken
accountNumber
recipientAccount
transactionId
```

Example:

```text
baseUrl = http://localhost:9000
```

Request URL:

```text
{{baseUrl}}/auth/register
```

Protected routes use:

```text
Bearer {{customerToken}}
```

---

## Complete Testing Flow

The recommended full test sequence is:

```text
1. Register Customer A
2. Login Customer A
3. Save Customer A JWT

4. Complete BVN or NIN onboarding
5. Verify customer KYC
6. Create Customer A bank account
7. Confirm ₦15,000 opening balance

8. Register Customer B
9. Login Customer B
10. Complete Customer B KYC
11. Create Customer B account

12. Perform name enquiry
13. Transfer Customer A → Customer B
14. Confirm Customer A balance decreases
15. Confirm Customer B balance increases

16. Check Customer A history
17. Confirm DEBIT transaction

18. Check Customer B history
19. Confirm CREDIT transaction

20. Query transaction status
21. Confirm SUCCESS

22. Test self-transfer
23. Confirm request is rejected

24. Perform name enquiry on another bank
25. Perform inter-bank transfer
26. Confirm INTER_BANK classification
27. Query transaction status
28. Confirm recipient receives funds
```

---

## Postman Collection Structure

The Postman collection can be organized as:

```text
MART_TECH Banking API

Authentication
├── Register
└── Login

Onboarding
├── BVN Onboarding
└── NIN Onboarding

Accounts
├── Create Account
├── My Account
├── Balance
└── Name Enquiry

Transactions
├── Transfer
├── Transaction History
└── Transaction Status
```

The collection can be exported to:

```text
Postman/
└── MART_TECH-Banking-API.postman_collection.json
```

Do not export or commit real JWT tokens, API keys, or API secrets.

---

## Assignment Requirement Checklist

### 1. Customer Onboarding System

- [x] Customer registration
- [x] Customer authentication
- [x] Simulated BVN creation
- [x] BVN validation
- [x] Simulated NIN creation
- [x] NIN validation
- [x] Customer identity matching
- [x] Account creation blocked before KYC verification

### 2. Account Creation

- [x] Account creation through NIBSS
- [x] Maximum of one account per customer
- [x] 10-digit account number generated through NIBSS
- [x] ₦15,000 initial funding

### 3. Core Banking Operations

- [x] Name enquiry
- [x] Account balance enquiry
- [x] Intra-bank funds transfer
- [x] Inter-bank funds transfer
- [x] Transaction Status Query
- [x] Self-transfer prevention
- [x] Insufficient balance check

### 4. Transaction History & Data Privacy

- [x] Transaction history
- [x] DEBIT transaction tracking
- [x] Local CREDIT transaction tracking
- [x] Customer history isolation
- [x] Account ownership validation
- [x] Transaction ownership validation
- [x] Customer cannot choose source account

### 5. NIBSS by Phoenix Integration

- [x] Fintech authentication
- [x] BVN integration
- [x] NIN integration
- [x] Account creation integration
- [x] Name enquiry integration
- [x] Balance integration
- [x] Funds transfer integration
- [x] Transaction status integration
- [x] Intra-bank transfer tested
- [x] Inter-bank transfer tested

---

## Git Security

The following files should not be committed:

```text
.env
node_modules/
*.log
```

Example `.gitignore`:

```text
node_modules/
.env
*.log
.DS_Store
```

An `.env.example` file should be committed instead.

Before pushing to GitHub, verify:

```bash
git status
```

The real `.env` file must not appear among files that will be committed.

If credentials were previously committed, adding `.env` to `.gitignore` does not remove them from Git history. Those credentials should be rotated before submission.

---

## Important Project Limitation

The NIBSS by Phoenix API documentation supplied for this project does not provide an incoming-transfer webhook or account-level transaction-history endpoint.

As a result, the application can reliably record:

- Transactions initiated through MART_TECH
- DEBIT records for MART_TECH senders
- CREDIT records where the recipient account is also known locally

Incoming inter-bank transfers initiated entirely by another bank are reflected in the NIBSS account balance but cannot automatically be discovered for local history without additional support from NIBSS.

---

## Important Notice

This project is an educational banking simulation developed for the TS Academy Backend Engineering assignment.

It does not interact with the production Nigerian banking system.

Only simulated BVN and NIN values should be used.

Real customer BVN, NIN, banking credentials, or other sensitive personal information must not be used for testing.

---

## Author

MART_TECH

TS Academy Backend Engineering Program

MART_TECH Banking System Project
