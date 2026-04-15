import React from "react";
import { FaUserMd } from "react-icons/fa";

type AvatarWithStatusProps = {
  image?: string;
  alt?: string;
  isActive?: "1" | "0";
  size?: number;
  fallbackIcon?: React.ElementType;
  showStatus?: boolean; 
};

const AvatarWithStatus: React.FC<AvatarWithStatusProps> = ({
  image,
  alt = "avatar",
  isActive = "0",
  size = 40,
  fallbackIcon,
  showStatus = true,
}) => {
  const statusColor = isActive === "1" ? "bg-green-500" : "bg-red-500";
  const IconComponent = fallbackIcon || FaUserMd;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="w-full h-full flex items-center justify-center rounded-full bg-[var(--color-surface)] border border-white shadow-sm overflow-hidden">
        {image ? (
          <img
            src={
              image.startsWith("data:")
                ? image
                : `data:image/png;base64,${image}`
            }
            alt={alt}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <IconComponent className="text-[var(--color-primary)]" />
        )}
      </div>

      {showStatus && (
        <span
          className={`absolute top-1 right-1 translate-x-1/4 -translate-y-1/4 border-2 border-white rounded-full ${statusColor}`}
          style={{
            width: size * 0.3,
            height: size * 0.3,
          }}
        />
      )}
    </div>
  );
};

export default AvatarWithStatus;