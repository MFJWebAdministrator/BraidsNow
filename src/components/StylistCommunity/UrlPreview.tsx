const VITE_APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN;

interface UrlPreviewProps {
    username: string;
}

export function UrlPreview({ username }: UrlPreviewProps) {
    const baseUrl = `${VITE_APP_DOMAIN}/`;
    const displayUrl = username ? baseUrl + username : baseUrl;

    return (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-[#3F0052]/20">
            <p className="text-sm text-gray-600 font-light tracking-normal">
                Your BraidsNow URL:
            </p>
            <p className="text-[#3F0052] font-medium tracking-normal break-all">
                {displayUrl}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-light tracking-normal">
                Share this link on social media to promote your services
            </p>
        </div>
    );
}
