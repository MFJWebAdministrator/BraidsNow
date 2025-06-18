import { Link } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
// import { useLogin } from '@/components/auth/hooks/useLogin';
import { ArrowLeft } from "lucide-react";

export function LoginPage() {
    // const navigate = useNavigate();
    // const { handleLogin, isLoading, error } = useLogin();

    // const handleLoginWithRedirect = async (credentials: any) => {
    //   try {
    //     // Perform login
    //     const user = await handleLogin(credentials);
    //     // await handleLogin(credentials);

    //     // Determine the redirect path based on the user's role
    //     if (user.role === 'stylist') {
    //       navigate('/stylist-dashboard'); // Redirect to stylist dashboard
    //     } else {
    //       navigate('/client-dashboard'); // Redirect to client dashboard
    //     }
    //   } catch (err) {
    //     console.error('Login failed:', err);
    //   }
    // };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Gradient Overlay */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <img
                    src="/images/Sign-In.jpg"
                    alt="Hair styling"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#3F0052]/90 to-[#DFA801]/50" />
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                    <Link
                        to="/"
                        className="inline-flex items-center text-[#3F0052] hover:text-[#DFA801] transition-colors mb-8 group"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                        <span className="tracking-normal">
                            Return to Homepage
                        </span>
                    </Link>

                    <h2 className="text-4xl font-light tracking-normal block mt-2 bg-gradient-to-r from-[#3F0052] to-[#DFA801] bg-clip-text text-transparent text-center">
                        Welcome Back!
                    </h2>
                    <p className="mt-2 text-center text-md tracking-normal text-black">
                        Sign In To Your BraidsNow.com Account
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
                    <div className="bg-gray-50 py-8 px-4 sm:px-10">
                        <LoginForm
                        // onSubmit={handleLoginWithRedirect} // Updated function
                        // isLoading={isLoading}
                        // error={error}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
