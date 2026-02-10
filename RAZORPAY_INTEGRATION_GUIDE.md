# Modern Razorpay Payment Integration

A secure, type-safe, and production-ready Razorpay payment integration for Next.js applications following 2026 best practices.

## 🚀 Features

- ✅ **Server-side order creation** - Secure order generation on the backend
- ✅ **Payment signature verification** - Server-side signature validation for security
- ✅ **TypeScript type safety** - Fully typed interfaces and components
- ✅ **Axios for HTTP requests** - Modern, promise-based HTTP client
- ✅ **Modern UX** - Toast notifications instead of alerts
- ✅ **Error handling** - Comprehensive error handling and user feedback
- ✅ **Loading states** - Clear loading indicators during payment flow
- ✅ **Script loading management** - Proper handling of Razorpay SDK loading
- ✅ **Customizable** - Flexible props for branding and configuration
- ✅ **Production ready** - Secure implementation following Razorpay best practices

## 📋 Prerequisites

1. **Razorpay Account**: Sign up at [razorpay.com](https://razorpay.com)
2. **API Keys**: Get your keys from Razorpay Dashboard
3. **Dependencies**: Install required packages:
   ```bash
   npm install axios razorpay
   ```
4. **Environment Variables**: Configure the following in `.env.local`:

```env
# Razorpay Keys
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Public Key for client-side (same as RAZORPAY_KEY_ID)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
```

## 🏗️ Architecture

### Payment Flow

```
1. User clicks "Pay" button
   ↓
2. Client calls /api/payment/create-order
   ↓
3. Server creates Razorpay order
   ↓
4. Client receives order ID
   ↓
5. Razorpay checkout modal opens
   ↓
6. User completes payment
   ↓
7. Razorpay sends payment response
   ↓
8. Client calls /api/payment/verify
   ↓
9. Server verifies signature (CRITICAL!)
   ↓
10. Payment confirmed, update database
```

### File Structure

```
src/
├── lib/
│   └── payment/
│       └── types.ts                    # TypeScript type definitions
├── app/
│   └── api/
│       └── payment/
│           ├── create-order/
│           │   └── route.ts           # Order creation endpoint
│           └── verify/
│               └── route.ts           # Payment verification endpoint
└── components/
    └── Payment.tsx                    # Payment component
```

## 💻 Usage

### Basic Example

```tsx
import Payment from "@/components/Payment";

export default function CheckoutPage() {
  const handleSuccess = async (paymentData) => {
    console.log("Payment successful!", paymentData);
    // Update order status, send email, etc.
  };

  return (
    <Payment
      amountInRupees={100}
      customerData={{
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "9876543210",
      }}
      onPaymentSuccess={handleSuccess}
    >
      Pay ₹100
    </Payment>
  );
}
```

### Advanced Example

```tsx
import Payment from "@/components/Payment";

export default function CheckoutPage() {
  const handleSuccess = async (paymentData) => {
    // Update database
    await fetch("/api/orders/update", {
      method: "POST",
      body: JSON.stringify({
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId,
        status: "PAID",
      }),
    });

    // Send confirmation email
    await fetch("/api/email/send", {
      method: "POST",
      body: JSON.stringify({
        to: customerEmail,
        template: "payment-success",
        data: paymentData,
      }),
    });

    // Redirect to success page
    router.push(`/orders/${paymentData.orderId}`);
  };

  const handleFailure = (error) => {
    // Log to error tracking service
    console.error("Payment failed:", error);

    // Show custom error page
    router.push("/payment-failed");
  };

  return (
    <Payment
      amountInRupees={499}
      customerData={{
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "9876543210",
      }}
      onPaymentSuccess={handleSuccess}
      onPaymentFailure={handleFailure}
      currency="INR"
      companyName="My Store"
      description="Premium Subscription"
      themeColor="#6366f1"
      notes={{
        product_id: "prod_123",
        subscription_plan: "premium",
      }}
    >
      Subscribe for ₹499/month
    </Payment>
  );
}
```

## 🔧 Component Props

| Prop               | Type                     | Required | Default              | Description                                              |
| ------------------ | ------------------------ | -------- | -------------------- | -------------------------------------------------------- |
| `amountInRupees`   | `number`                 | ✅       | -                    | Amount in rupees (will be converted to paise)            |
| `customerData`     | `CustomerData`           | ✅       | -                    | Customer information (firstName, lastName, email, phone) |
| `onPaymentSuccess` | `(data) => void`         | ✅       | -                    | Callback when payment is verified successfully           |
| `onPaymentFailure` | `(error) => void`        | ❌       | -                    | Callback when payment fails                              |
| `currency`         | `string`                 | ❌       | `"INR"`              | Currency code                                            |
| `companyName`      | `string`                 | ❌       | `"Your Company"`     | Company name shown in checkout                           |
| `description`      | `string`                 | ❌       | `"Product Purchase"` | Payment description                                      |
| `themeColor`       | `string`                 | ❌       | `"#3399cc"`          | Checkout modal theme color                               |
| `children`         | `ReactNode`              | ✅       | -                    | Button text/content                                      |
| `disabled`         | `boolean`                | ❌       | `false`              | Disable the payment button                               |
| `notes`            | `Record<string, string>` | ❌       | -                    | Additional notes to attach to order                      |

## 🔐 Security Best Practices

### ✅ What This Implementation Does Right

1. **Server-side Signature Verification**: The payment signature is verified on the server using HMAC-SHA256. Never trust client-side verification alone.

2. **Environment Variables**: Sensitive keys are stored in environment variables, not in code.

3. **Type Safety**: TypeScript interfaces prevent runtime errors and improve code quality.

4. **Error Handling**: Comprehensive error handling at every step of the payment flow.

5. **Validation**: Input validation on both client and server sides.

### ⚠️ Additional Recommendations

1. **Add Rate Limiting**: Implement rate limiting on payment endpoints to prevent abuse.

2. **Add Logging**: Log all payment events for audit trails.

3. **Add Idempotency**: Implement idempotency keys to prevent duplicate payments.

4. **Database Integration**: Store order and payment details in your database.

5. **Webhook Integration**: Set up Razorpay webhooks for asynchronous payment notifications.

## 📝 API Endpoints

### POST /api/payment/create-order

Creates a new Razorpay order.

**Request Body:**

```json
{
  "amount": 10000,
  "currency": "INR",
  "customerData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "notes": {
    "product_id": "123"
  }
}
```

**Response:**

```json
{
  "orderId": "order_xxxxxxxxxxxxx",
  "amount": 10000,
  "currency": "INR"
}
```

### POST /api/payment/verify

Verifies the payment signature.

**Request Body:**

```json
{
  "razorpay_order_id": "order_xxxxxxxxxxxxx",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
  "razorpay_signature": "xxxxxxxxxxxxx",
  "customerData": {
    "email": "john@example.com"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment verified successfully",
  "paymentId": "pay_xxxxxxxxxxxxx",
  "orderId": "order_xxxxxxxxxxxxx"
}
```

## 🧪 Testing

### Test Mode

Use test API keys in development:

- Keys starting with `rzp_test_` are test keys
- Keys starting with `rzp_live_` are production keys

### Test Cards

**Successful Payment:**

- Card: `4111 1111 1111 1111`
- CVV: Any 3 digits
- Expiry: Any future date

**Failed Payment:**

- Card: `4111 1111 1111 1234`
- CVV: Any 3 digits
- Expiry: Any future date

### Testing the Integration

1. Visit your test page at `/test`
2. Click the payment button
3. Use the test card details
4. Complete the payment
5. Check console logs for payment data
6. Verify toast notifications appear

## 🐛 Debugging

### Common Issues

**1. "Payment gateway not configured"**

- Check if environment variables are set correctly
- Ensure `.env.local` is in the project root
- Restart the development server after adding env variables

**2. "Payment verification failed"**

- Check if `RAZORPAY_KEY_SECRET` matches your Razorpay dashboard
- Ensure the signature verification logic is not modified
- Check if the order ID and payment ID are correct

**3. Razorpay script not loading**

- Check internet connection
- Check browser console for script errors
- Try disabling ad blockers

## 📚 Additional Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Payment Gateway Integration Guide](https://razorpay.com/docs/payment-gateway/web-integration/standard/)
- [Signature Verification](https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/#step-4-verify-signature)

## 📄 License

This implementation is part of your e-commerce project.

## 🤝 Contributing

When modifying the payment integration:

1. Never skip signature verification
2. Always validate input on both client and server
3. Keep error messages user-friendly
4. Log errors for debugging
5. Test thoroughly in test mode before going live

---

**⚠️ IMPORTANT SECURITY REMINDER**

Never expose your `RAZORPAY_KEY_SECRET` to the client. It should only be used on the server side. Always verify payment signatures on the server before marking orders as paid.
