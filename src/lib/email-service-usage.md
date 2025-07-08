# Email Service Usage Guide

This guide explains how to use the email service that sends emails through Firebase Functions using SendGrid's dynamic templates.

## Architecture

The email service uses a **backend-first approach**:
- **Frontend**: React components call Firebase Functions API endpoints
- **Backend**: Firebase Functions use SendGrid's API to send emails with dynamic templates
- **Templates**: SendGrid dynamic templates handle email design and content

## Setup

### 1. Backend Environment Variables

Add your SendGrid API key to your Firebase Functions environment:

```bash
# In Firebase Functions .env or environment variables
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

### 2. SendGrid Template IDs

Update the template IDs in `functions/src/email-service.ts` with your actual SendGrid dynamic template IDs:

```typescript
private static readonly TEMPLATE_IDS = {
  WELCOME_CLIENT: 'd-your-actual-template-id',
  WELCOME_STYLIST: 'd-your-actual-template-id',
  // ... other template IDs
};
```

### 3. Frontend Environment Variables

Add your Firebase Functions API URL to your frontend environment:

```bash
# In your frontend .env
VITE_API_URL=https://us-central1-braidsnow.cloudfunctions.net/api
```

## Usage Methods

### Method 1: Using the Hook (Recommended)

```tsx
import { useEmail } from '@/hooks/use-email';

const MyComponent = () => {
  const { 
    sendWelcomeClientEmail, 
    loading, 
    error, 
    success 
  } = useEmail();

  const handleSendWelcomeEmail = async () => {
    await sendWelcomeClientEmail({
      clientName: 'John Doe',
      clientEmail: 'john@example.com'
    });
  };

  return (
    <div>
      <button onClick={handleSendWelcomeEmail} disabled={loading}>
        {loading ? 'Sending...' : 'Send Welcome Email'}
      </button>
      
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">Email sent successfully!</p>}
    </div>
  );
};
```

### Method 2: Using API Client Directly

```tsx
import { sendWelcomeClientEmail } from '@/lib/api-client';

const handleSendEmail = async () => {
  try {
    await sendWelcomeClientEmail('John Doe', 'john@example.com');
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
```

### Method 3: Using Email Service Class

```tsx
import { EmailService } from '@/lib/email-service';

const handleSendEmail = async () => {
  try {
    await EmailService.sendWelcomeClientEmail({
      clientName: 'John Doe',
      clientEmail: 'john@example.com'
    });
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
```

## Available Email Functions

### Welcome Emails
- `sendWelcomeClientEmail(data: WelcomeClientData)`
- `sendWelcomeStylistEmail(data: WelcomeStylistData)`

### Appointment Emails
- `sendAppointmentConfirmationClient(data: AppointmentConfirmationData)`
- `sendAppointmentConfirmationStylist(data: StylistAppointmentData)`
- `sendAppointmentDeniedClient(data: AppointmentDeniedData)`
- `sendFullPaymentReminderForClient(data: FullPaymentReminderData)`

### Payment & Account Emails
- `sendPaymentFailureForStylist(data: PaymentFailureData)`
- `sendAccountCancellationStylist(data: AccountCancellationData)`

### Message Notifications
- `sendMessageNotificationStylist(data: MessageNotificationData)`
- `sendMessageNotificationClient(data: MessageNotificationData)`

## Data Interfaces

### WelcomeClientData
```typescript
{
  clientName: string;
  clientEmail: string;
}
```

### AppointmentConfirmationData
```typescript
{
  clientName: string;
  clientEmail: string;
  stylistName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
}
```

### MessageNotificationData
```typescript
{
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  userType: 'client' | 'stylist';
}
```

## Hook State Management

The `useEmail` hook provides:

- `loading`: Boolean indicating if an email is being sent
- `error`: String containing error message if email failed
- `success`: Boolean indicating if email was sent successfully
- `resetState()`: Function to reset the state

## Error Handling

```tsx
const { sendWelcomeClientEmail, loading, error, success } = useEmail();

const handleSendEmail = async () => {
  try {
    await sendWelcomeClientEmail({
      clientName: 'John Doe',
      clientEmail: 'john@example.com'
    });
  } catch (error) {
    // Handle error (already handled by the hook)
    console.error('Email sending failed:', error);
  }
};
```

## Backend API Endpoints

The Firebase Functions provide these endpoints:

- `POST /send-welcome-client-email`
- `POST /send-welcome-stylist-email`
- `POST /send-appointment-confirmation-client`
- `POST /send-appointment-confirmation-stylist`
- `POST /send-payment-failure-stylist`
- `POST /send-account-cancellation-stylist`
- `POST /send-appointment-denied-client`
- `POST /send-full-payment-reminder-client`
- `POST /send-message-notification-stylist`
- `POST /send-message-notification-client`

All endpoints require Firebase authentication and validate required parameters.

## Security Features

✅ **Authentication**: All endpoints require Firebase ID token
✅ **Parameter Validation**: Required fields are validated
✅ **Error Handling**: Comprehensive error handling and logging
✅ **Rate Limiting**: Can be implemented at Firebase Functions level
✅ **Template Security**: SendGrid templates handle sensitive data

## Example Integration in Registration Flow

```tsx
import { useEmail } from '@/hooks/use-email';

const ClientRegistrationForm = () => {
  const { sendWelcomeClientEmail, loading, error, success } = useEmail();
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Your registration logic here
    const user = await registerUser(formData);
    
    // Send welcome email
    await sendWelcomeClientEmail({
      clientName: formData.name,
      clientEmail: formData.email
    });
    
    // Navigate to dashboard or show success message
  };

  return (
    <form onSubmit={handleRegistration}>
      {/* Your form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating Account...' : 'Register'}
      </button>
      
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">Account created and welcome email sent!</p>}
    </form>
  );
};
```

## Testing

You can use the example components in `src/components/EmailExamples.tsx` to test the email functionality:

```tsx
import { EmailExamples } from '@/components/EmailExamples';

// In your app or test page
<EmailExamples />
```

This will render forms for testing different email types with proper error handling and loading states.

## Deployment

### Backend (Firebase Functions)
1. Deploy your Firebase Functions: `firebase deploy --only functions`
2. Ensure environment variables are set in Firebase Console
3. Verify SendGrid API key is configured

### Frontend
1. Build and deploy your React app
2. Ensure `VITE_API_URL` points to your deployed Firebase Functions
3. Test email functionality in production

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Firebase Functions CORS is properly configured
2. **Authentication Errors**: Verify Firebase ID token is being sent
3. **Template Errors**: Check SendGrid template IDs are correct
4. **API Key Issues**: Verify SendGrid API key is valid and has proper permissions

### Debug Steps

1. Check browser network tab for API calls
2. Review Firebase Functions logs
3. Verify SendGrid template variables match your data
4. Test with SendGrid's template testing feature 