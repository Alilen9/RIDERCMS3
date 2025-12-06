# RiderCMS API Documentation

Welcome to the RiderCMS backend API. This document provides a detailed overview of all available API endpoints, their purpose, required parameters, and example responses.

## Table of Contents

1. [Authentication (`/api/auth`)](#authentication-apiauth)
2. Admin (`/api/admin`)
3. Booths (`/api/booths`)
4. Webhooks (`/api/mpesa`)
4. Microservices

---

## Authentication (`/api/auth`)

These endpoints handle user registration, login, and session management.

### `POST /api/auth/register`

Creates a new user account. This process registers the user with Firebase Authentication and creates a corresponding profile in the PostgreSQL database.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "a-strong-password",
  "name": "John Doe",
  "phoneNumber": "+15551234567"
}
```

**Responses:**

- `201 Created`: User registered successfully.
- `400 Bad Request`: Missing required fields.
- `409 Conflict`: The email address is already in use.

### `POST /api/auth/sessionLogin`

Logs a user in by validating their Firebase ID token and creating a secure, HTTP-only session cookie. It also returns the user's profile from the database.

**Request Body:**

```json
{
  "idToken": "firebase-id-token-from-client"
}
```

**Responses:**

- `200 OK`: Login successful. Sets a `session` cookie and returns the user's profile.

    ```json
    {
      "status": "success",
      "message": "User logged in successfully.",
      "user": {
        "firebaseUid": "some-firebase-uid",
        "email": "user@example.com",
        "displayName": "John Doe",
        "phoneNumber": "+15551234567",
        "role": "customer",
        "status": "active"
      }
    }
    ```

- `401 Unauthorized`: The provided `idToken` is invalid or missing.
- `403 Forbidden`: The user's account is `inactive` or `suspended`.
- `404 Not Found`: The user exists in Firebase but not in the PostgreSQL database.

### `POST /api/auth/verify-phone`

Finalizes the phone number verification process. This endpoint is called after the client successfully completes the Firebase phone OTP flow.

**Request Body:**

```json
{
  "idToken": "firebase-id-token-from-phone-auth"
}
```

**Responses:**

- `200 OK`: Phone number successfully marked as verified in the database.
- `401 Unauthorized`: The provided `idToken` is invalid or missing.

---

## Admin (`/api/admin`)

These endpoints are for administrative use only and require an authenticated admin session.

### `POST /api/admin/users/set-role`

Assigns a specific role to a user, granting them different permissions within the system.

**Request Body:**

```json
{
  "uid": "user-firebase-uid",
  "newRole": "admin"
}
```

**Valid Roles:** `admin`, `customer`, `driver`

### `GET /api/admin/users`

Retrieves a paginated list of all users from Firebase Authentication.

**Query Parameters:**

- `pageSize` (optional, number, default: 100): The number of users to fetch.
- `pageToken` (optional, string): The token to fetch the next page of results.

### `POST /api/admin/users/set-status`

Activates or deactivates a user's account. A deactivated user will be blocked from logging in.

**Request Body:**

```json
{
  "uid": "user-firebase-uid",
  "status": "inactive"
}
```

**Valid Statuses:** `active`, `inactive`, `suspended`

### `GET /api/admin/booths/status`

Retrieves a comprehensive, real-time status of all booths, their slots, and the batteries within them.

**Responses:**

- `200 OK`: Returns a structured list of all booths and their contents.

    ```json
    [
      {
        "boothUid": "booth-001",
        "location": "Nairobi CBD",
        "status": "online",
        "slots": [
          {
            "slotIdentifier": "A01",
            "status": "occupied",
            "battery": {
              "batteryUid": "batt-xyz-789",
              "chargeLevel": 98,
              "ownerEmail": "user@example.com"
            }
          }
        ]
      }
    ]
    ```

---

## Booths (`/api/booths`)

Endpoints for interacting with battery swap booths.

### `POST /api/booths/initiate-deposit`

Initiates a battery deposit session for a logged-in user at a specific booth. This is typically called when a user scans a QR code on the booth.

**Authentication:** Requires a valid user session cookie.

**Request Body:**

```json
{
  "boothId": "booth-001"
}
```

### `POST /api/booths/confirm-deposit`

Confirms that a battery has been successfully deposited. **This endpoint is intended to be called by the booth hardware**, not by a user's app.

**Authentication:** Requires a valid API key passed as a query parameter (`?apiKey=YOUR_SECRET_KEY`).

**Request Body:**

```json
{
  "boothUid": "booth-001",
  "slotIdentifier": "A01",
  "batteryUid": "batt-xyz-789",
  "chargeLevel": 15
}
```

### `GET /api/booths/my-battery-status`

Allows a logged-in user to check the status and location of their currently deposited battery.

**Authentication:** Requires a valid user session cookie.

**Responses:**

- `200 OK`: Returns the battery's status.

    ```json
    {
      "batteryUid": "batt-xyz-789",
      "chargeLevel": 98,
      "boothUid": "booth-001",
      "slotIdentifier": "A01"
    }
    ```

- `404 Not Found`: User does not have a battery currently deposited.

### `POST /api/booths/initiate-withdrawal`

Initiates the withdrawal process for a user's charged battery. This calculates the cost and triggers an M-Pesa STK push for payment.

**Authentication:** Requires a valid user session cookie.

**Responses:**

- `200 OK`: STK push initiated successfully. The client should now poll for payment status.

    ```json
    {
      "message": "Please complete the payment on your phone to proceed.",
      "checkoutRequestId": "ws_CO_123456789",
      "amount": 850
    }
    ```

### `GET /api/booths/withdrawal-status/:checkoutRequestId`

Allows the client to poll for the status of a withdrawal payment after an STK push has been initiated.

**Authentication:** Requires a valid user session cookie.

**Responses:**

- `200 OK`: Returns the current payment status.

    ```json
    {
      "paymentStatus": "paid"
    }
    ```

    or

    ```json
    {
      "paymentStatus": "pending"
    }
    ```

### `POST /api/booths/open-for-collection`

Called by the client **after** payment is confirmed via the polling endpoint. This is the final step that triggers the hardware to open the slot for battery collection.

**Authentication:** Requires a valid user session cookie.

**Request Body:**

```json
{
  "checkoutRequestId": "ws_CO_123456789"
}
```

### `POST /api/booths/confirm-withdrawal`

Confirms that a battery has been successfully collected. **This endpoint is intended to be called by the booth hardware**, not by a user's app.

**Authentication:** Requires a valid API key.

**Request Body:**

```json
{
  "boothUid": "booth-001",
  "slotIdentifier": "A01"
}
```

### `GET /api/booths/history`

Retrieves the deposit and withdrawal history for the logged-in user.

**Authentication:** Requires a valid user session cookie.

---

## Webhooks (`/api/mpesa`)

Endpoints designed to be called by external services.

### `POST /api/mpesa/callback`

The callback URL that the M-Pesa API posts to after an STK push transaction is completed or fails. This endpoint is not intended for direct client use.

---

## Microservices

These are standalone services, likely deployed as separate Cloud Run instances.

### `POST /closeSession` (closesession-service)

A mock endpoint to simulate closing a user session.

**Request Body:**

```json
{
  "msisdn": "+15551234567",
  "sessionId": "session-xyz-789"
}
```
