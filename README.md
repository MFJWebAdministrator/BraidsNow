#BraidsNow

BraidsNow.com is an online platform built to connect people with professional braiders in their area. Whether you're looking for box braids, knotless, twists, or specialty styles, BraidsNow makes it easy to find and book experienced stylists near you. Our mission is to make hair care more accessible while helping braiders grow their business with visibility and booking tools.

The platform is designed to support both clients and braiders with features like real-time availability, style galleries, and verified reviews. BraidsNow is more than a directory—it's a community that celebrates Black beauty, craftsmanship, and convenience.

## 🚀 Technical Stack & Architecture

### Frontend Technologies
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Vite** - Fast build tool and development server
- **React Router DOM** - Client-side routing for SPA navigation
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **React Hook Form** - Performant forms with validation
- **Zod** - TypeScript-first schema validation

### Backend & Infrastructure
- **Firebase** - Complete backend-as-a-service solution
  - **Firestore** - NoSQL database for real-time data
  - **Firebase Auth** - User authentication and authorization
  - **Firebase Storage** - File storage for images and documents
  - **Firebase Functions** - Serverless backend functions
  - **Firebase Hosting** - Static site hosting
- **Stripe** - Payment processing and subscription management
- **TanStack Query** - Data fetching and caching library

### Key Features & Components
- **Real-time Booking System** - Live appointment scheduling
- **User Authentication** - Role-based access (Client/Stylist)
- **Messaging System** - In-app communication between users
- **Payment Integration** - Secure payment processing
- **Image Management** - Profile pictures and portfolio uploads
- **Calendar Integration** - Appointment scheduling and management
- **Search & Filtering** - Advanced stylist discovery
- **Responsive Design** - Mobile-first approach

## 📁 Project Structure

```
BraidsNow/
├── src/
│   ├── app/                    # App router pages
│   ├── components/             # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard layouts and components
│   │   ├── ui/                # Base UI components (shadcn/ui)
│   │   └── ...                # Feature-specific components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries and configurations
│   │   ├── firebase/          # Firebase configuration and services
│   │   ├── schemas/           # Zod validation schemas
│   │   └── utils/             # Helper functions
│   ├── pages/                 # Page components
│   │   ├── dashboard/         # Dashboard pages (Client/Stylist)
│   │   ├── Booking/           # Booking flow pages
│   │   └── ...                # Other page components
│   └── data/                  # Static data and content
├── functions/                 # Firebase Cloud Functions
├── public/                    # Static assets
└── firebase.json             # Firebase configuration
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Firebase CLI
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BraidsNow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   VITE_APP_DOMAIN=https://braidsnow.com
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

### Firebase Setup

1. **Enable Firebase Services**
   - Authentication (Email/Password, Google)
   - Firestore Database
   - Storage
   - Functions
   - Hosting

2. **Configure Firestore Rules**
   - Set up security rules for data access
   - Configure indexes for queries

3. **Set up Stripe Integration**
   - Configure webhook endpoints
   - Set up payment processing

## 🔧 Key Development Concepts

### State Management
- **React Context** - Global state management
- **TanStack Query** - Server state management
- **Local State** - Component-level state with useState

### Authentication Flow
- **Protected Routes** - Role-based access control
- **User Types** - Client and Stylist user roles
- **Session Management** - Firebase Auth integration

### Data Flow
- **Real-time Updates** - Firestore listeners for live data
- **Optimistic Updates** - UI updates before server confirmation
- **Error Handling** - Comprehensive error boundaries and fallbacks

### Component Architecture
- **Atomic Design** - Reusable component system
- **Composition Pattern** - Flexible component composition
- **Custom Hooks** - Logic extraction and reusability

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Environment Configuration
- Production environment variables
- Firebase project configuration
- Stripe production keys

## 📱 Mobile Responsiveness
- **Mobile-first design** approach
- **Responsive breakpoints** for all screen sizes
- **Touch-friendly** interactions
- **Progressive Web App** capabilities

## 🔒 Security Features
- **Firebase Security Rules** - Database and storage protection
- **Input Validation** - Zod schema validation
- **XSS Protection** - Sanitized user inputs
- **CORS Configuration** - Cross-origin request handling

## 🧪 Testing Strategy
- **Component Testing** - React Testing Library
- **Integration Testing** - User flow testing
- **E2E Testing** - Cypress for critical paths

## 📊 Performance Optimization
- **Code Splitting** - Route-based lazy loading
- **Image Optimization** - Compressed and responsive images
- **Caching Strategy** - TanStack Query caching
- **Bundle Analysis** - Webpack bundle analyzer

## 🔄 CI/CD Pipeline
- **GitHub Actions** - Automated testing and deployment
- **Firebase CLI** - Automated deployment to Firebase
- **Environment Management** - Separate configs for dev/staging/prod

## 📈 Monitoring & Analytics
- **Firebase Analytics** - User behavior tracking
- **Error Monitoring** - Firebase Crashlytics
- **Performance Monitoring** - Firebase Performance

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License
This project is proprietary software. All rights reserved.

---

For technical support or questions, please contact the development team.

## Google Calendar Integration

The platform includes full Google Calendar integration for stylists:

### Features
- **Automatic Sync**: New appointments are automatically added to Google Calendar
- **Two-way Updates**: Changes in BraidsNow update Google Calendar events
- **Client Invitations**: Clients receive Google Calendar invitations
- **Reminders**: Google Calendar notifications and reminders
- **Bulk Sync**: Sync all existing appointments at once

### Setup Steps

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google Calendar API

2. **Configure OAuth 2.0**:
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID
   - Set authorized redirect URI: `https://yourdomain.com/google-calendar-callback`
   - Download client credentials

3. **Environment Variables**:
   Add these to your `.env` file:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
   VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com/google-calendar-callback
   ```

4. **User Experience**:
   - Stylists can connect their Google Calendar from the Calendar page
   - One-click sync for all existing appointments
   - Automatic sync for new appointments
   - Easy disconnect option

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project
- Stripe account
- Google Cloud project (for calendar integration)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/braidsnow.git
cd braidsnow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Firebase
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# Google Calendar
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_REDIRECT_URI=https://yourdomain.com/google-calendar-callback
```

5. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── ui/            # Base UI components
│   └── GoogleCalendarConnect.tsx  # Google Calendar integration
├── hooks/              # Custom React hooks
│   └── use-google-calendar.ts     # Google Calendar hook
├── lib/                # Utility libraries
│   ├── firebase/       # Firebase configuration
│   ├── google-calendar.ts         # Google Calendar service
│   └── stripe.ts       # Stripe configuration
├── pages/              # Page components
│   ├── dashboard/      # Dashboard pages
│   └── GoogleCalendarCallback.tsx # OAuth callback
└── App.tsx             # Main app component
```

## Deployment

### Firebase Hosting

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy
```

### Environment Variables

Make sure to set all environment variables in your production environment:

- **Firebase**: API keys and project configuration
- **Stripe**: Publishable and secret keys
- **Google Calendar**: OAuth 2.0 credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@braidsnow.com or create an issue in the repository.
