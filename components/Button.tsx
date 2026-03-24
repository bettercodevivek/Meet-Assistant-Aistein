import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary";
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  onClick,
  variant: _variant,
  ...props
}) => {
  return (
    <button
      className={`bg-[#7559FF] text-white text-sm px-6 py-2 rounded-lg disabled:opacity-50 h-fit ${className ?? ""}`}
      onClick={props.disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </button>
  );
};
