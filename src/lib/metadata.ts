export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonical?: string;
}

export const pageMetadata: Record<string, PageMetadata> = {
  // Public Pages
  home: {
    title: "BraidsNow.com - Find Professional Hair Stylists Near You | Book Braids, Twists & More",
    description: "Connect with professional braiders and stylists specializing in Black hair textures. Book appointments for box braids, knotless braids, twists, and specialty styles. Find verified stylists in your area with real-time availability.",
    keywords: ["hair stylist", "braids", "box braids", "knotless braids", "hair appointment", "black hair stylist", "braider", "hair booking", "professional stylist", "hair services"],
    ogImage: "/images/Hero Image.jpeg",
    canonical: "https://braidsnow.com"
  },

  findStylists: {
    title: "Find Hair Stylists Near You | BraidsNow.com - Professional Braiders & Stylists",
    description: "Search and discover professional hair stylists and braiders in your area. Browse portfolios, read reviews, and book appointments with verified stylists specializing in Black hair textures.",
    keywords: ["find stylist", "hair stylist near me", "braider near me", "professional stylist", "hair appointment booking", "stylist search", "hair services"],
    ogImage: "/images/Your Journey to Beautiful Styles.jpg",
    canonical: "https://braidsnow.com/find-stylists"
  },

  stylistProfile: {
    title: "Stylist Profile | BraidsNow.com - Professional Hair Services & Booking",
    description: "View stylist profile, portfolio, services, and book appointments. See reviews, pricing, and availability for professional hair styling services.",
    keywords: ["stylist profile", "hair stylist", "portfolio", "hair services", "appointment booking", "stylist reviews", "hair pricing"],
    canonical: "https://braidsnow.com/stylist"
  },

  booking: {
    title: "Book Hair Appointment | BraidsNow.com - Easy Online Booking",
    description: "Book your hair appointment online with professional stylists. Choose your preferred date, time, and services. Secure booking with deposit payment.",
    keywords: ["book appointment", "hair appointment", "online booking", "stylist booking", "hair services booking", "appointment scheduling"],
    canonical: "https://braidsnow.com/book"
  },

  login: {
    title: "Sign In | BraidsNow.com - Access Your Account",
    description: "Sign in to your BraidsNow.com account to manage appointments, view stylist profiles, and access your dashboard.",
    keywords: ["sign in", "login", "account access", "user dashboard", "stylist login", "client login"],
    canonical: "https://braidsnow.com/login"
  },

  stylistRegistration: {
    title: "Register as Stylist | BraidsNow.com - Join Our Professional Network",
    description: "Join BraidsNow.com as a professional stylist. Create your profile, showcase your work, and start accepting bookings from clients in your area.",
    keywords: ["stylist registration", "join as stylist", "stylist signup", "professional stylist", "hair stylist registration", "stylist profile"],
    canonical: "https://braidsnow.com/stylist-registration"
  },

  clientCommunity: {
    title: "Client Community | BraidsNow.com - Join Our Hair Care Community",
    description: "Join our client community to discover new styles, share experiences, and connect with other hair care enthusiasts. Get inspired for your next look.",
    keywords: ["client community", "hair community", "hair care", "style inspiration", "hair tips", "community forum"],
    canonical: "https://braidsnow.com/client-community"
  },

  stylistCommunity: {
    title: "Stylist Community | BraidsNow.com - Professional Network for Hair Stylists",
    description: "Connect with fellow professional stylists, share techniques, and grow your business. Join our exclusive community for hair care professionals.",
    keywords: ["stylist community", "professional network", "hair stylist community", "stylist forum", "professional development", "stylist networking"],
    canonical: "https://braidsnow.com/stylist-community"
  },

  businessTools: {
    title: "Business Tools for Stylists | BraidsNow.com - Professional Management Tools",
    description: "Access professional business tools designed for hair stylists. Manage appointments, track earnings, and grow your business with our comprehensive suite.",
    keywords: ["business tools", "stylist tools", "appointment management", "business management", "stylist software", "professional tools"],
    canonical: "https://braidsnow.com/business-tools"
  },

  successStories: {
    title: "Success Stories | BraidsNow.com - Real Stories from Our Community",
    description: "Read inspiring success stories from stylists and clients in our community. Discover how BraidsNow.com is transforming the hair care industry.",
    keywords: ["success stories", "stylist success", "client testimonials", "community stories", "hair care success", "transformation stories"],
    canonical: "https://braidsnow.com/success-stories"
  },

  styleShow: {
    title: "Style Show | BraidsNow.com - Discover Beautiful Hair Styles",
    description: "Explore our style show featuring beautiful braids, twists, and specialty styles. Get inspired for your next hair appointment with our curated collection.",
    keywords: ["style show", "hair styles", "braid styles", "style inspiration", "hair gallery", "style showcase"],
    canonical: "https://braidsnow.com/style-show"
  },

  faqs: {
    title: "Frequently Asked Questions | BraidsNow.com - Get Your Answers",
    description: "Find answers to commonly asked questions about BraidsNow.com, our services, booking process, and platform features.",
    keywords: ["FAQ", "frequently asked questions", "help", "support", "common questions", "platform guide"],
    canonical: "https://braidsnow.com/faqs"
  },

  terms: {
    title: "Terms and Conditions | BraidsNow.com - Platform Terms of Service",
    description: "Read our terms and conditions for using BraidsNow.com. Understand your rights and responsibilities as a user of our platform.",
    keywords: ["terms and conditions", "terms of service", "platform terms", "user agreement", "legal terms", "service terms"],
    canonical: "https://braidsnow.com/terms"
  },

  privacy: {
    title: "Privacy Policy | BraidsNow.com - Your Privacy Matters",
    description: "Learn how BraidsNow.com protects your privacy and handles your personal information. Read our comprehensive privacy policy.",
    keywords: ["privacy policy", "data protection", "personal information", "privacy rights", "data security", "user privacy"],
    canonical: "https://braidsnow.com/privacy"
  },

  // Dashboard Pages - Client
  clientDashboard: {
    title: "Client Dashboard | BraidsNow.com - Manage Your Appointments",
    description: "Access your client dashboard to manage appointments, view favorite stylists, and track your hair care journey.",
    keywords: ["client dashboard", "appointment management", "client portal", "booking history", "favorite stylists"],
    canonical: "https://braidsnow.com/dashboard/client"
  },

  clientAppointments: {
    title: "My Appointments | BraidsNow.com - View and Manage Bookings",
    description: "View and manage your upcoming and past hair appointments. Reschedule, cancel, or book new appointments with your favorite stylists.",
    keywords: ["my appointments", "appointment history", "booking management", "upcoming appointments", "appointment tracking"],
    canonical: "https://braidsnow.com/dashboard/client/appointments"
  },

  clientMessages: {
    title: "Messages | BraidsNow.com - Communicate with Your Stylist",
    description: "Send and receive messages with your stylists. Stay connected and coordinate your hair appointments through our secure messaging system.",
    keywords: ["messages", "stylist communication", "appointment messaging", "client messages", "secure messaging"],
    canonical: "https://braidsnow.com/dashboard/client/messages"
  },

  clientSettings: {
    title: "Account Settings | BraidsNow.com - Manage Your Profile",
    description: "Update your account settings, personal information, and preferences. Manage your BraidsNow.com profile and account details.",
    keywords: ["account settings", "profile management", "personal information", "account preferences", "user settings"],
    canonical: "https://braidsnow.com/dashboard/client/settings"
  },

  clientFavorites: {
    title: "My Favorites | BraidsNow.com - Your Favorite Stylists",
    description: "View and manage your favorite stylists. Quick access to book appointments with stylists you love and trust.",
    keywords: ["favorite stylists", "saved stylists", "preferred stylists", "stylist favorites", "quick booking"],
    canonical: "https://braidsnow.com/dashboard/client/favorites"
  },

  // Dashboard Pages - Stylist
  stylistDashboard: {
    title: "Stylist Dashboard | BraidsNow.com - Manage Your Business",
    description: "Access your stylist dashboard to manage appointments, track earnings, and grow your hair styling business.",
    keywords: ["stylist dashboard", "business management", "appointment management", "earnings tracking", "stylist portal"],
    canonical: "https://braidsnow.com/dashboard/stylist"
  },

  stylistAppointments: {
    title: "Appointments | BraidsNow.com - Manage Your Bookings",
    description: "View and manage your upcoming appointments, client information, and booking schedule. Stay organized with your hair styling business.",
    keywords: ["stylist appointments", "booking management", "client appointments", "schedule management", "appointment calendar"],
    canonical: "https://braidsnow.com/dashboard/stylist/appointments"
  },

  stylistMessages: {
    title: "Messages | BraidsNow.com - Client Communication",
    description: "Communicate with your clients through our secure messaging system. Coordinate appointments and provide excellent customer service.",
    keywords: ["stylist messages", "client communication", "appointment coordination", "customer service", "secure messaging"],
    canonical: "https://braidsnow.com/dashboard/stylist/messages"
  },

  stylistSettings: {
    title: "Business Settings | BraidsNow.com - Manage Your Profile",
    description: "Update your business profile, services, pricing, and account settings. Manage your stylist profile and business information.",
    keywords: ["business settings", "stylist profile", "service management", "pricing settings", "business profile"],
    canonical: "https://braidsnow.com/dashboard/stylist/settings"
  },

  stylistServices: {
    title: "Services Management | BraidsNow.com - Manage Your Offerings",
    description: "Add, edit, and manage your hair styling services. Set pricing, descriptions, and availability for each service you offer.",
    keywords: ["services management", "hair services", "service pricing", "service offerings", "stylist services"],
    canonical: "https://braidsnow.com/dashboard/stylist/services"
  },

  stylistSchedule: {
    title: "Schedule Management | BraidsNow.com - Set Your Availability",
    description: "Set your working hours, availability, and schedule preferences. Manage your appointment calendar and booking availability.",
    keywords: ["schedule management", "availability settings", "working hours", "appointment calendar", "booking availability"],
    canonical: "https://braidsnow.com/dashboard/stylist/schedule"
  },

  stylistFavorites: {
    title: "Client Favorites | BraidsNow.com - Your Favorite Clients",
    description: "View and manage your favorite clients. Quick access to client information and booking history for your preferred clients.",
    keywords: ["client favorites", "favorite clients", "client management", "client relationships", "client tracking"],
    canonical: "https://braidsnow.com/dashboard/stylist/favorites"
  },

  stylistPayments: {
    title: "Payments | BraidsNow.com - Track Your Earnings",
    description: "View your payment history, track earnings, and manage your financial information. Monitor your business performance and income.",
    keywords: ["payments", "earnings tracking", "payment history", "financial management", "business income"],
    canonical: "https://braidsnow.com/dashboard/stylist/payments"
  },

  stylistCalendar: {
    title: "Calendar | BraidsNow.com - Appointment Calendar",
    description: "View your appointment calendar, manage your schedule, and stay organized with your hair styling business.",
    keywords: ["calendar", "appointment calendar", "schedule view", "business calendar", "appointment management"],
    canonical: "https://braidsnow.com/dashboard/stylist/calendar"
  },

  styleBoard: {
    title: "Style Board | BraidsNow.com - Hair Style Inspiration",
    description: "Create and manage your style board with hair inspiration, favorite looks, and style preferences for your next appointment.",
    keywords: ["style board", "hair inspiration", "style preferences", "hair looks", "style collection"],
    canonical: "https://braidsnow.com/dashboard/stylist/styleboard"
  },

  // Payment Pages
  paymentSuccess: {
    title: "Payment Successful | BraidsNow.com - Booking Confirmed",
    description: "Your payment has been processed successfully. Your appointment is confirmed and you'll receive booking details shortly.",
    keywords: ["payment success", "booking confirmed", "appointment confirmed", "payment processed", "booking success"],
    canonical: "https://braidsnow.com/payment-success"
  },

  paymentCancel: {
    title: "Payment Cancelled | BraidsNow.com - Booking Not Completed",
    description: "Your payment was cancelled. Your appointment has not been confirmed. Please try again or contact support for assistance.",
    keywords: ["payment cancelled", "booking cancelled", "payment failed", "appointment not confirmed", "payment error"],
    canonical: "https://braidsnow.com/payment-cancel"
  },

  // Success Pages
  registrationSuccess: {
    title: "Registration Successful | BraidsNow.com - Welcome to Our Community",
    description: "Welcome to BraidsNow.com! Your registration was successful. Start exploring stylists and booking your first appointment.",
    keywords: ["registration success", "welcome", "account created", "registration complete", "community welcome"],
    canonical: "https://braidsnow.com/registration-success"
  },

  bookingSuccess: {
    title: "Booking Successful | BraidsNow.com - Appointment Confirmed",
    description: "Your appointment has been successfully booked! You'll receive confirmation details and can manage your booking from your dashboard.",
    keywords: ["booking success", "appointment confirmed", "booking complete", "appointment booked", "confirmation"],
    canonical: "https://braidsnow.com/booking-success"
  },

  bookingFailed: {
    title: "Booking Failed | BraidsNow.com - Please Try Again",
    description: "We're sorry, your booking could not be completed. Please try again or contact support for assistance.",
    keywords: ["booking failed", "appointment failed", "booking error", "try again", "support needed"],
    canonical: "https://braidsnow.com/booking-failed"
  }
};

export function getPageMetadata(pageKey: string): PageMetadata {
  return pageMetadata[pageKey] || {
    title: "BraidsNow.com - Professional Hair Styling Platform",
    description: "Connect with professional hair stylists and braiders specializing in Black hair textures. Book appointments, discover styles, and join our community.",
    keywords: ["hair stylist", "braids", "appointment booking", "professional stylist", "hair services"],
    canonical: "https://braidsnow.com"
  };
} 